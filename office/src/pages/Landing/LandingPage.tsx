import { FunctionComponent } from "react";
import { pipe, propOr } from "ramda";
import { SignIn } from "./SignIn";

interface Props {
  onSignIn: (name: string) => void;
}

export const LandingPage: FunctionComponent<Props> = ({ onSignIn: onJoin }) => {
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
  const first = names[0];
  const second = getInitial(names[1]);
  return `${first} ${second}`.trim();
};

const getInitial = (name: string) => {
  if (name.length === 0) return "";
  return name.charAt(0).toUpperCase().concat(".");
};
