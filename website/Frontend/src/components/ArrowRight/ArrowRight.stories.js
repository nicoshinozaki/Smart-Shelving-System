import { ArrowRight } from ".";

export default {
  title: "Components/ArrowRight",
  component: ArrowRight,

  argTypes: {
    size: {
      options: [
        "sixteen",
        "twenty-four",
        "forty-eight",
        "twenty",
        "thirty-two",
        "forty",
      ],
      control: { type: "select" },
    },
  },
};

export const Default = {
  args: {
    size: "sixteen",
    className: {},
    img: "/img/size-48.png",
  },
};
