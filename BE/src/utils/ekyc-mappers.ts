export type NormalizedOcr = {
  fullName: string | null;
  dob: string | null;
  idNumber: string | null;
  issueDate: string | null;
  issuePlace: string | null;
  address: string | null;
};

export const normalizeOcr = (params: {
  ocrFrontRaw: unknown;
  ocrBackRaw: unknown;
}): NormalizedOcr => {
  const front = (params.ocrFrontRaw as any)?.object ?? {};
  const back = (params.ocrBackRaw as any)?.object ?? {};

  const fullName = (front?.name ?? null) as string | null;
  const dob = (front?.birth_day ?? null) as string | null;
  const idNumber = (front?.id ?? null) as string | null;
  const issueDate = (back?.issue_date ?? null) as string | null;
  const issuePlace = (back?.issue_place ?? null) as string | null;
  const address = (front?.recent_location ?? null) as string | null;

  return { fullName, dob, idNumber, issueDate, issuePlace, address };
};

