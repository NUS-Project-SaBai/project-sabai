import { WebcamInput } from "@/components/interactive/inputs/WebcamInput";
import LinkExistingPatient from "@/components/scanFace/LinkExistingPatient";
import MatchingPatients from "@/components/scanFace/MatchingPatients";
import RegistrationPage from "@/components/scanFace/RegistrationPage";
import { useState } from "react";
import { Mode } from "@/types/scan";
import Breadcrumbs from "@/components/Breadcrumbs";

function ScanFacePage() {
  const [, setCameraIsOpen] = useState(false);
  const [imgDetails, setImgDetails] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>(Mode.MATCHING);

  function handlePictureCapture(picture: string | null) {
    setImgDetails(picture);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Scan Face" }]}
      />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900">Scan Face</h1>
        <div className="flex flex-col space-y-2">
          <WebcamInput
            imageDetails={imgDetails}
            setImageDetails={handlePictureCapture}
            cameraIsOpenCallback={(isOpen) => setCameraIsOpen(isOpen)}
            size={400}
          />
        </div>

        {mode === Mode.REGISTERING && (
          <RegistrationPage
            imgDetails={imgDetails}
            setImgDetails={setImgDetails}
            setMode={setMode}
          />
        )}

        {mode === Mode.MATCHING && imgDetails && (
          <MatchingPatients
            key={imgDetails}
            imgDetails={imgDetails}
            setMode={setMode}
          />
        )}

        {mode === Mode.MANUAL && imgDetails && (
          <LinkExistingPatient
            imgDetails={imgDetails}
            setImgDetails={setImgDetails}
            setMode={setMode}
          />
        )}
      </div>
    </div>
  );
}

export default ScanFacePage;
