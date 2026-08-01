// Parses a SunPass statement CSV export and matches each toll to the
// reservation that was active for that car at that time.
//
// Real SunPass exports look like:
// POSTED DATE,TRANSACTION DATE,TRANSACTION TIME,TRANSACTION NUMBER,
// TRANSPONDER/LICENSE PLATE,AGENCY NAME,LANE,AXLE,
// DESCRIPTION / PLAZA NAME,DEBIT(-),CREDIT(+),BALANCE
//
// Notes on quirks this handles:
// - Date and time are separate columns, combined here into one timestamp.
// - The transponder column sometimes holds a license plate instead (e.g.
//   "IJNH27-FL") when the toll was charged by plate rather than tag — the
//   car's transponder_number in the admin UI needs to match whatever
//   value shows up here for that car, tag or plate.
// - DEBIT(-) has a leading "$" and is the actual toll charge; CREDIT(+)
//   rows (payments/refunds) are skipped since they aren't tolls to bill.

const COLUMN_ALIASES = {
  transponder: ['transponder', 'transponder number', 'tag number', 'transponder/license plate'],
  timestamp: ['post date/time', 'transaction date/time', 'date/time'],
  transactionDate: ['transaction date'],
  transactionTime: ['transaction time'],
  plaza: ['plaza', 'exit plaza', 'facility', 'description / plaza name'],
  amount: ['amount', 'toll amount', 'transaction amount', 'debit(-)', 'debit'],
};

function findColumn(headers: string[], aliases: string[]): number {
  const lower = headers.map((h) => h.trim().toLowerCase());
  for (const alias of aliases) {
    const idx = lower.indexOf(alias);
    if (idx !== -1) return idx;
  }
  return -1;
}

// Simple quote-aware CSV line splitter — handles the common case of a
// quoted field containing a comma (e.g. a plaza name with a comma in it).
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

export type ParsedToll = {
  transponder_number: string;
  toll_plaza: string;
  charged_at: string; // ISO timestamp
  amount: number;
};

export function parseSunPassCsv(csvText: string): ParsedToll[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]);
  const cols = {
    transponder: findColumn(headers, COLUMN_ALIASES.transponder),
    timestamp: findColumn(headers, COLUMN_ALIASES.timestamp),
    transactionDate: findColumn(headers, COLUMN_ALIASES.transactionDate),
    transactionTime: findColumn(headers, COLUMN_ALIASES.transactionTime),
    plaza: findColumn(headers, COLUMN_ALIASES.plaza),
    amount: findColumn(headers, COLUMN_ALIASES.amount),
  };

  const hasTimestamp = cols.timestamp !== -1 || (cols.transactionDate !== -1 && cols.transactionTime !== -1);

  if (cols.transponder === -1 || !hasTimestamp || cols.amount === -1) {
    throw new Error(
      'Could not find expected columns in this export. ' +
        'Check the header row against COLUMN_ALIASES in lib/tolls.ts.'
    );
  }

  const rows: ParsedToll[] = [];
  for (const line of lines.slice(1)) {
    const fields = splitCsvLine(line);

    const rawAmount = fields[cols.amount]?.replace(/[^0-9.-]/g, '') ?? '';
    const amount = parseFloat(rawAmount);
    // Skip rows with no charge (e.g. a payment/credit row rather than a toll).
    if (Number.isNaN(amount) || amount <= 0) continue;

    const timestampSource =
      cols.transactionDate !== -1 && cols.transactionTime !== -1
        ? `${fields[cols.transactionDate]} ${fields[cols.transactionTime]}`
        : fields[cols.timestamp];

    rows.push({
      transponder_number: fields[cols.transponder]?.trim() ?? '',
      toll_plaza: cols.plaza !== -1 ? fields[cols.plaza]?.trim() ?? '' : '',
      charged_at: new Date(timestampSource.trim()).toISOString(),
      amount,
    });
  }

  return rows;
}

export type ReservationForMatching = {
  id: string;
  car_id: string;
  start_date: string;
  end_date: string;
  pickup_time: string; // e.g. "10:00:00"
  dropoff_time: string;
};

export type CarForMatching = {
  id: string;
  transponder_number: string | null;
};

// For each parsed toll, finds the car by transponder number, then finds
// the reservation for that car whose actual pickup→dropoff window (date
// AND time, not just the date range) covers the toll's timestamp.
// Tolls that can't be matched (no car, or no reservation covering that
// moment) come back with reservation_id: null so an admin can review
// them manually.
export function matchTollsToReservations(
  tolls: ParsedToll[],
  cars: CarForMatching[],
  reservations: ReservationForMatching[]
): Array<ParsedToll & { reservation_id: string | null }> {
  return tolls.map((toll) => {
    const car = cars.find((c) => c.transponder_number === toll.transponder_number);
    if (!car) return { ...toll, reservation_id: null };

    const tollDate = new Date(toll.charged_at);
    const match = reservations.find((r) => {
      if (r.car_id !== car.id) return false;
      const start = new Date(`${r.start_date}T${r.pickup_time}`);
      const end = new Date(`${r.end_date}T${r.dropoff_time}`);
      return tollDate >= start && tollDate <= end;
    });

    return { ...toll, reservation_id: match?.id ?? null };
  });
}
