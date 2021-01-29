import { ReactElement, useCallback, useState } from "react";
import { LandingPage } from "./pages/Landing";
import { Office } from "./pages/Office";

type ShowState = "LANDING" | "OFFICE";

export const App = () => {
  const [name, setName] = useState("");
  const [showState, setShowState] = useState<ShowState>("LANDING");

  const handleJoin = useCallback((name: string) => {
    setName(name);
    setShowState("OFFICE");
  }, []);

  const stateMap: Record<ShowState, ReactElement> = {
    LANDING: <LandingPage onJoin={handleJoin} />,
    OFFICE: <Office name={name} />,
  };

  return stateMap[showState];
};
