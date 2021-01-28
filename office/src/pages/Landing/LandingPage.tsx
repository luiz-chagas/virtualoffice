import { FunctionComponent } from "react";
import { pipe, propOr } from "ramda";
import { SignIn } from "./SignIn";

interface Props {
  onJoin: (name: string) => void;
}

export const LandingPage: FunctionComponent<Props> = ({ onJoin }) => {
  const handleUserSignedIn = pipe(
    propOr("Anonymous", "displayName"),
    makeName,
    onJoin
  );

  return (
    <div
      style={{
        display: "flex",
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#3A6EA5",
      }}
    >
      <SignIn onUserSignedIn={handleUserSignedIn} />
    </div>
  );
};

const makeName = (name: string) => {
  const names = name.split(" ");
  return names[0] + ` ${names[1].charAt(0).concat(".")}`;
};
