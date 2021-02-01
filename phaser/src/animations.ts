export const registerAnimations = (
  name: string,
  manager: Phaser.Animations.AnimationManager
) => {
  manager.create({
    key: `${name}-left-walk`,
    frames: manager.generateFrameNames(name, {
      start: 4,
      end: 7,
    }),
    frameRate: 10,
    repeat: -1,
  });
  manager.create({
    key: `${name}-right-walk`,
    frames: manager.generateFrameNames(name, {
      start: 8,
      end: 11,
    }),
    frameRate: 10,
    repeat: -1,
  });
  manager.create({
    key: `${name}-front-walk`,
    frames: manager.generateFrameNames(name, {
      start: 0,
      end: 3,
    }),
    frameRate: 10,
    repeat: -1,
  });
  manager.create({
    key: `${name}-back-walk`,
    frames: manager.generateFrameNames(name, {
      start: 12,
      end: 15,
    }),
    frameRate: 10,
    repeat: -1,
  });
};
