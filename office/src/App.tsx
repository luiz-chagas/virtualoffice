import { pipe } from "ramda";
import { ReactElement, useState } from "react";
import { LandingPage } from "./pages/Landing";
import { Office } from "./pages/Office";
import { System } from "./pages/System";

type ShowState = "LANDING" | "OFFICE" | "SYSTEM";

export const App = () => {
  const [name, setName] = useState("");
  const [showState, setShowState] = useState<ShowState>("LANDING");

  const handleSignIn = pipe(setName, () => setShowState("SYSTEM"));

  const stateMap: Record<ShowState, ReactElement> = {
    LANDING: <LandingPage onSignIn={handleSignIn} />,
    OFFICE: <Office name={name} />,
    SYSTEM: (
      <System
        onJoin={() => setShowState("OFFICE")}
        onSignOut={() => setShowState("LANDING")}
      />
    ),
  };

  return stateMap[showState];
};
