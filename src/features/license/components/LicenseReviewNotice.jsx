import { AlertTriangle } from "lucide-react";
import { pickFirst } from "../model/licenseAnalysisModel";

export default function LicenseReviewNotice({ warnings, reviewItems }) {
  if (warnings.length === 0 && reviewItems.length === 0) {
    return null;
  }

  return (
    <div className="mt-5">
      <div className="flex items-start gap-3">
        <AlertTriangle size={19} className="mt-0.5 shrink-0 text-amber-200" />

        <div>
          <p className="font-bold text-amber-100">
            사람이 한 번 더 확인해야 하는 항목이 있습니다.
          </p>

          <div className="mt-2 space-y-1 text-sm leading-6 text-amber-50/80">
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}

            {reviewItems.map((item, index) => (
              <p key={`${pickFirst(item, ["type"], "review")}-${index}`}>
                {pickFirst(
                  item,
                  ["message", "description", "title", "type"],
                  "검토가 필요한 항목입니다."
                )}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
