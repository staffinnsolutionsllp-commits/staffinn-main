import React from 'react';
import './HourglassLoader.css';

const HourglassLoader = ({ size = '56px', message = 'Loading...' }) => {
  return (
    <div className="hourglass-container">
      <svg
        className="hourglass"
        viewBox="0 0 56 56"
        width={size}
        height={size}
        role="img"
        aria-label="Hourglass being flipped clockwise and circled by three white curves fading in and out"
      >
        <clipPath id="sand-mound-top">
          <path
            className="hourglass__sand-mound-top"
            d="M 14.613 13.087 C 15.814 12.059 19.3 8.039 20.3 6.539 C 21.5 4.789 21.5 2.039 21.5 2.039 L 3 2.039 C 3 2.039 3 4.789 4.2 6.539 C 5.2 8.039 8.686 12.059 9.887 13.087 C 11 14.039 12.25 14.039 12.25 14.039 C 12.25 14.039 13.5 14.039 14.613 13.087 Z"
          />
        </clipPath>
        <clipPath id="sand-mound-bottom">
          <path
            className="hourglass__sand-mound-bottom"
            d="M 14.613 20.452 C 15.814 21.48 19.3 25.5 20.3 27 C 21.5 28.75 21.5 31.5 21.5 31.5 L 3 31.5 C 3 31.5 3 28.75 4.2 27 C 5.2 25.5 8.686 21.48 9.887 20.452 C 11 19.5 12.25 19.5 12.25 19.5 C 12.25 19.5 13.5 19.5 14.613 20.452 Z"
          />
        </clipPath>
        <g transform="translate(2,2)">
          <g
            fill="none"
            stroke="hsl(0,0%,100%)"
            strokeDasharray="153.94 153.94"
            strokeDashoffset="153.94"
            strokeLinecap="round"
            transform="rotate(-90,26,26)"
          >
            <circle
              className="hourglass__motion-thick"
              strokeWidth="2.5"
              cx="26"
              cy="26"
              r="24.5"
              transform="rotate(0,26,26)"
            />
            <circle
              className="hourglass__motion-medium"
              strokeWidth="1.75"
              cx="26"
              cy="26"
              r="24.5"
              transform="rotate(90,26,26)"
            />
            <circle
              className="hourglass__motion-thin"
              strokeWidth="1"
              cx="26"
              cy="26"
              r="24.5"
              transform="rotate(180,26,26)"
            />
          </g>
          <g className="hourglass__model" transform="translate(13.75,9.25)">
            {/* glass */}
            <path
              fill="hsl(var(--hue),90%,85%)"
              d="M 1.5 2 L 23 2 C 23 2 22.5 8.5 19 12 C 16 15.5 13.5 13.5 13.5 16.75 C 13.5 20 16 18 19 21.5 C 22.5 25 23 31.5 23 31.5 L 1.5 31.5 C 1.5 31.5 2 25 5.5 21.5 C 8.5 18 11 20 11 16.75 C 11 13.5 8.5 15.5 5.5 12 C 2 8.5 1.5 2 1.5 2 Z"
            />
            {/* sand */}
            <g stroke="hsl(35,90%,90%)" strokeLinecap="round">
              <line
                className="hourglass__sand-grain-left"
                strokeWidth="1"
                strokeDasharray="0.25 33.75"
                x1="12"
                y1="15.75"
                x2="12"
                y2="20.75"
              />
              <line
                className="hourglass__sand-grain-right"
                strokeWidth="1"
                strokeDasharray="0.25 33.75"
                x1="12.5"
                y1="16.75"
                x2="12.5"
                y2="21.75"
              />
              <line
                className="hourglass__sand-drop"
                strokeWidth="1"
                strokeDasharray="0.5 107.5"
                x1="12.25"
                y1="18"
                x2="12.25"
                y2="31.5"
              />
              <line
                className="hourglass__sand-fill"
                strokeWidth="1.5"
                strokeDasharray="54 54"
                x1="12.25"
                y1="14.75"
                x2="12.25"
                y2="31.5"
              />
              <line
                className="hourglass__sand-line-left"
                stroke="hsl(35,90%,83%)"
                strokeWidth="1"
                strokeDasharray="1 107"
                x1="12"
                y1="16"
                x2="12"
                y2="31.5"
              />
              <line
                className="hourglass__sand-line-right"
                stroke="hsl(35,90%,83%)"
                strokeWidth="1"
                strokeDasharray="12 96"
                x1="12.5"
                y1="16"
                x2="12.5"
                y2="31.5"
              />
              {/* mounds */}
              <g fill="hsl(35,90%,90%)" strokeWidth="0">
                <path
                  clipPath="url(#sand-mound-top)"
                  d="M 12.25 15 L 15.392 13.486 C 21.737 11.168 22.5 2 22.5 2 L 2 2.013 C 2 2.013 2.753 11.046 9.009 13.438 L 12.25 15 Z"
                />
                <path
                  clipPath="url(#sand-mound-bottom)"
                  d="M 12.25 18.5 L 15.392 20.014 C 21.737 22.332 22.5 31.5 22.5 31.5 L 2 31.487 C 2 31.487 2.753 22.454 9.009 20.062 Z"
                />
              </g>
            </g>
            {/* glass glare */}
            <g fill="none" opacity="0.7" strokeLinecap="round" strokeWidth="2">
              <path
                className="hourglass__glare-top"
                stroke="hsl(0,0%,100%)"
                d="M 19.437 3.421 C 19.437 3.421 19.671 6.454 17.914 8.846 C 16.157 11.238 14.5 11.5 14.5 11.5"
              />
              <path
                className="hourglass__glare-bottom"
                stroke="hsla(0,0%,100%,0)"
                d="M 19.437 3.421 C 19.437 3.421 19.671 6.454 17.914 8.846 C 16.157 11.238 14.5 11.5 14.5 11.5"
                transform="rotate(180,12.25,16.75)"
              />
            </g>
            {/* caps */}
            <rect fill="hsl(var(--hue),90%,50%)" width="24.5" height="2" />
            <rect
              fill="hsl(var(--hue),90%,57.5%)"
              rx="0.5"
              ry="0.5"
              x="2.5"
              y="0.5"
              width="19.5"
              height="1"
            />
            <rect fill="hsl(var(--hue),90%,50%)" y="31.5" width="24.5" height="2" />
            <rect
              fill="hsl(var(--hue),90%,57.5%)"
              rx="0.5"
              ry="0.5"
              x="2.5"
              y="32"
              width="19.5"
              height="1"
            />
          </g>
        </g>
      </svg>
      {message && <div className="hourglass-message">{message}</div>}
    </div>
  );
};

export default HourglassLoader;