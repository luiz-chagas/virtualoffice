import { ReactElement, useCallback, useState } from "react";
import { LandingPage } from "./LandingPage";
import { Office } from "./Office";

type ShowState = "LANDING" | "OFFICE";

export const App = () => {
  const [name, setName] = useState("");
  const [showState, setShowState] = useState<ShowState>("LANDING");

  const handleNameChange = useCallback((newName: string) => {
    setName(newName);
  }, []);

  const handleJoin = useCallback(() => {
    setShowState("OFFICE");
  }, []);

  const stateMap: Record<ShowState, ReactElement> = {
    LANDING: (
      <LandingPage
        name={name}
        onJoin={handleJoin}
        onNameChange={handleNameChange}
      />
    ),
    OFFICE: <Office name={name} />,
  };

  return stateMap[showState];
};
