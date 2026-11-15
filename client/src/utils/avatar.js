export const getAvatarSrc = (pic) => {
  if (
    !pic ||
    pic.includes("icon-library.com/images/anonymous-avatar-icon")
  ) {
    return "/default-avatar.svg";
  }

  return pic;
};
