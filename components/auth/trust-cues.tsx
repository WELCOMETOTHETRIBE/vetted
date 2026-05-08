import { BadgeCheck, Briefcase, ShieldCheck } from "lucide-react";

/**
 * Three short trust cues shown beneath the BrandMark on the auth left panel.
 * Per the research brief: clearance-aware identity, cleared roles, audit-aware
 * AI. These are the headline value props of clearD as distinct from the rest
 * of the MacTech suite.
 */
const cues = [
  {
    icon: BadgeCheck,
    title: "Clearance-aware identity, by design",
    body: "Build a Cleared Mission Profile with the right level of context — without leaking program names, classified detail, or anything you would not put on an unclass slide.",
  },
  {
    icon: Briefcase,
    title: "Mission-fit roles, surfaced for you",
    body: "Cleared roles from defense contractors and federal program staff, ranked by clearance fit, mission area alignment, and continuity of work — not just keyword match.",
  },
  {
    icon: ShieldCheck,
    title: "Audit-aware AI decision support",
    body: "Recommendation models annotate every match with reason codes, so recruiters and ops staff can defend decisions to compliance, customers, and counsel.",
  },
];

export function TrustCues() {
  return (
    <div className="space-y-5">
      {cues.map((cue) => {
        const Icon = cue.icon;
        return (
          <div key={cue.title} className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#F1994C]/15 border border-[#F1994C]/30 flex items-center justify-center">
              <Icon className="w-5 h-5 text-[#F2A65A]" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{cue.title}</p>
              <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">{cue.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
