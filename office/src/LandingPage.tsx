import { FunctionComponent, useEffect } from "react";
import { Window, TextBox, Button } from "react-windows-xp";
import { isEmpty, lte, pipe, propSatisfies, when, __ } from "ramda";
import { isNotEmpty } from "./utils/isNotEmpty";

interface Props {
  name: string;
  onNameChange: (newName: string) => void;
  onJoin: () => void;
}

export const LandingPage: FunctionComponent<Props> = ({
  name,
  onNameChange,
  onJoin,
}) => {
  useEffect(() => {
    when(isNotEmpty, onNameChange)(localStorage.getItem("name") ?? "");
  }, [onNameChange]);

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
      <div
        style={{
          maxWidth: 400,
        }}
      >
        <Window
          title="Connect to Crema"
          showClose
          onClose={() => {
            window.location.href =
              "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
          }}
        >
          <div style={{ padding: "8px" }}>
            <TextBox
              label="Who are you?"
              stacked
              id="cremaname"
              placeholder="Your Name Goes Here"
              value={name}
              onChange={when(
                propSatisfies(lte(__, 12), "length"),
                onNameChange
              )}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                paddingTop: "16px",
              }}
            >
              <Button
                onClick={pipe(() => localStorage.setItem("name", name), onJoin)}
                disabled={isEmpty(name)}
              >
                Join Loft
              </Button>
            </div>
          </div>
        </Window>
      </div>
    </div>
  );
};
