import { PatientPhoto } from "@/components/PatientPhoto";
import { DetailRow } from "@/components/referrals/DetailRow";
import { calculateAge } from "@/lib/utils/patient";

export type ReferralOverview = {
  patientName: string;
  patientCode: string;
  patientImageUrl: string | null;
  patientDateOfBirth: Date;
  patientContactNo: string | null;
  patientHasPoorCard: boolean;
  patientHasBS2Card: boolean;
  patientHasSabaiCard: boolean;
  villageCode: string;
  villageColorHex: string;
  referredFor: string;
  referralNotes: string | null;
};

const Placeholder = ({ text }: { text: string }) => (
  <span className="text-slate-500">{text}</span>
);

/**
 * Read-only summary of the patient and why they were referred. First section
 * of the referral details accordion.
 */
export function ReferralOverviewSection({
  referral,
}: {
  referral: ReferralOverview;
}) {
  const cards = [
    { label: "POOR", held: referral.patientHasPoorCard },
    { label: "BS2", held: referral.patientHasBS2Card },
    { label: "Sabai Card", held: referral.patientHasSabaiCard },
  ].filter((card) => card.held);

  return (
    <>
      <div className="flex items-center gap-4 border-b border-slate-100 py-6">
        <PatientPhoto
          pictureUrl={referral.patientImageUrl}
          className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
        />
        <div>
          <p className="text-lg font-semibold text-slate-900">
            {referral.patientName}
          </p>
          <p className="inline-flex items-center gap-2 text-sm text-slate-600">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: referral.villageColorHex }}
              title={referral.villageCode}
            />
            {referral.patientCode}
          </p>
        </div>
      </div>

      <dl className="divide-y divide-slate-100">
        <DetailRow label="Date of Birth">
          {new Date(referral.patientDateOfBirth).toLocaleDateString()} (
          {calculateAge(referral.patientDateOfBirth)} years)
        </DetailRow>
        <DetailRow label="Phone Number">
          {referral.patientContactNo || <Placeholder text="Not recorded" />}
        </DetailRow>
        <DetailRow label="Cards">
          {cards.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {cards.map((card) => (
                <li
                  key={card.label}
                  className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200"
                >
                  {card.label}
                </li>
              ))}
            </ul>
          ) : (
            <Placeholder text="No cards" />
          )}
        </DetailRow>
        <DetailRow label="Referral Type">{referral.referredFor}</DetailRow>
        <DetailRow label="Referral Notes">
          {referral.referralNotes ? (
            <p className="whitespace-pre-wrap">{referral.referralNotes}</p>
          ) : (
            <Placeholder text="No notes entered" />
          )}
        </DetailRow>
      </dl>
    </>
  );
}
