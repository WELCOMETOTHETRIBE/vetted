import Image from "next/image";

/**
 * BrandMark — clearD product badge for the auth left panel. Mirrors
 * Governance's BrandMark structure (logo + uppercase eyebrow + couplet
 * headline + supporting paragraph) so users moving between MacTech apps
 * feel an immediate kinship. Per Section 11.1 of the research brief, the
 * eyebrow must read exactly `clearD`.
 */
export function BrandMark() {
  return (
    <div>
      <Image
        src="/cleard.png"
        alt="clearD by MacTech"
        width={280}
        height={92}
        className="h-12 xl:h-14 w-auto object-contain object-left mb-8"
        priority
      />
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F1994C] mb-3">
        clearD
      </p>
      <h1 className="text-4xl xl:text-5xl font-bold tracking-tight text-white leading-tight">
        Cleared talent,
        <br />
        mission-ready by design.
      </h1>
      <p className="mt-4 text-lg text-gray-400 leading-relaxed max-w-md">
        The clearance-first professional network for transitioning service
        members, defense contractors, and federal program staff. Cleared
        Mission Profiles, mission-fit sourcing, and audit-aware AI decision
        support — for the people doing the work.
      </p>
    </div>
  );
}
