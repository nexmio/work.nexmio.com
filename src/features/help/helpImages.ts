/** The pictures of the guide (`img/`, made by `pnpm help:shots`), by the path the text uses. */
const files = import.meta.glob<string>("./img/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});

/** The address of a picture written as `img/name.png` in a topic, or undefined if it is gone. */
export function helpImage(src: string): string | undefined {
  return files[`./${src}`];
}
