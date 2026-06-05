/* 
THIS PAGE WAS WRITTEN TO TEST THE CLOUDINARY UPLOAD FUNCTIONALITY. 
IT IS NOT MEANT TO BE PRODUCTION-READY AND MAY CONTAIN SIMPLIFICATIONS OR HARDCODED VALUES FOR TESTING PURPOSES.

TO BE REFACTORED LATER:
- Error handling and user feedback are minimal and should be enhanced for a better UX.
- The page currently does not handle optional fields or validation beyond basic HTML5 constraints.
*/

import { WebcamInput } from "@/components/interactive/inputs/WebcamInput";
import Manual from "@/components/Manual";
import MatchingPatients from "@/components/MatchingPatients";
import RegistrationPage from "@/components/RegistrationPage";
import { useState } from "react";
enum Mode {
  REGISTERING = "registering",
  MANUAL = "manual",
  MATCHING = "matching",
  BLANK = "",
}

function ScanFacePage() {
  const [, setCameraIsOpen] = useState(false);
  const [imgDetails, setImgDetails] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>(Mode.REGISTERING);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900">Scan Face</h1>
        <div className="flex flex-col space-y-2">
          <WebcamInput
            imageDetails={imgDetails}
            setImageDetails={(picture) => setImgDetails(picture)}
            cameraIsOpenCallback={(isOpen) => setCameraIsOpen(isOpen)}
            width={500}
            height={500}
          />
        </div>

        {mode === Mode.REGISTERING && (
          <RegistrationPage
            imgDetails={imgDetails}
            setImgDetails={setImgDetails}
          />
        )}

        {mode === Mode.MATCHING && <MatchingPatients />}

        {mode === Mode.MANUAL && <Manual />}
      </div>
    </div>
  );
}

export default ScanFacePage;
