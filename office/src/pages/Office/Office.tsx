interface Props {
  name: string;
}

export const Office = ({ name }: Props) => {
  return (
    <div
      style={{
        position: "absolute",
        height: "100%",
        width: "100%",
        top: 0,
        left: 0,
      }}
    >
      <iframe
        width="100%"
        height="100%"
        style={{
          border: "none",
        }}
        title="Crema Virtual Office"
        sandbox="allow-same-origin allow-scripts"
        src={`/phaser?name=${name}&date=${Date.now()}`}
      />
    </div>
  );
};
