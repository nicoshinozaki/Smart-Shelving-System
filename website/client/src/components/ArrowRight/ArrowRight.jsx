/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import "./style.css";

export const ArrowRight = ({ className, img = "/img/size-48.png" ,size}) => {
  return (
    <img
      className={`arrow-right ${size} ${className}`}
      alt="Size"
      src={
        size === "sixteen"
          ? "/img/size-16.png"
          : size === "twenty"
            ? "/img/size-20.png"
            : size === "twenty-four"
              ? "/img/size-24.png"
              : size === "thirty-two"
                ? "/img/size-32.png"
                : size === "forty"
                  ? "/img/size-40.png"
                  : img
      }
    />
  );
};

ArrowRight.propTypes = {
  size: PropTypes.oneOf([
    "sixteen",
    "twenty-four",
    "forty-eight",
    "twenty",
    "thirty-two",
    "forty",
  ]),
  img: PropTypes.string,
};
