// @ts-nocheck
import { useEffect, useRef, useState } from 'react';

const COLOR_PALETTE = {
   ArcticPowder: '#F1F6F4',
   MysticMint: '#050E3C',
   Forsythia: '#FFC801',
   DeepSaffron: '#FF9932',
   NocturnalExpedition: '#FE7743',
   OceanicNoir: '#172B36'
};

const DAY_COLOR = COLOR_PALETTE.MysticMint;
const DAY_BALL_COLOR = COLOR_PALETTE.NocturnalExpedition;
const NIGHT_COLOR = COLOR_PALETTE.NocturnalExpedition;
const NIGHT_BALL_COLOR = COLOR_PALETTE.MysticMint;
const SQUARE_SIZE = 25;
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 600;
const MIN_SPEED = 5;
const MAX_SPEED = 10;
const BALL_RADIUS = 12;

interface Ball {
   x: number;
   y: number;
   dx: number;
   dy: number;
   reverseColor: string;
   ballColor: string;
}

export default function PongWars() {
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const [dayScore, setDayScore] = useState(288);
   const [nightScore, setNightScore] = useState(288);
   const animationFrameRef = useRef<number>();
   const squaresRef = useRef<string[][]>([]);
   const ballsRef = useRef<Ball[]>([]);
   const lastUpdateRef = useRef<number>(0);

   useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const numSquaresX = CANVAS_WIDTH / SQUARE_SIZE;
      const numSquaresY = CANVAS_HEIGHT / SQUARE_SIZE;

      squaresRef.current = Array(numSquaresY)
         .fill(null)
         .map((_, i) =>
            Array(numSquaresX)
               .fill(null)
               .map((_, j) => (j < numSquaresX / 2 ? DAY_COLOR : NIGHT_COLOR))
         );

      ballsRef.current = [
         {
            x: CANVAS_WIDTH / 4,
            y: CANVAS_HEIGHT / 2,
            dx: 8,
            dy: -8,
            reverseColor: DAY_COLOR,
            ballColor: DAY_BALL_COLOR
         },
         {
            x: (CANVAS_WIDTH / 4) * 3,
            y: CANVAS_HEIGHT / 2,
            dx: -8,
            dy: 8,
            reverseColor: NIGHT_COLOR,
            ballColor: NIGHT_BALL_COLOR
         }
      ];

      const clampSpeed = (value: number) => {
         const speed = Math.abs(value);
         if (speed < MIN_SPEED) return Math.sign(value) * MIN_SPEED;
         if (speed > MAX_SPEED) return Math.sign(value) * MAX_SPEED;
         return value;
      };

      const drawSquares = () => {
         squaresRef.current.forEach((row, i) => {
            row.forEach((color, j) => {
               ctx.fillStyle = color;
               ctx.fillRect(j * SQUARE_SIZE, i * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
            });
         });
      };

      const drawBalls = () => {
         ballsRef.current.forEach((ball) => {
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = ball.ballColor;
            ctx.fill();
            ctx.closePath();
         });
      };

      const updateScores = () => {
         let dayCount = 0;
         let nightCount = 0;
         squaresRef.current.forEach((row) => {
            row.forEach((color) => {
               if (color === DAY_COLOR) dayCount++;
               else nightCount++;
            });
         });
         setDayScore(dayCount);
         setNightScore(nightCount);
      };

      const checkSquareCollision = (ball: Ball) => {
         const checkPoints = 8;
         for (let i = 0; i < checkPoints; i++) {
            const angle = (Math.PI * 2 * i) / checkPoints;
            const checkX = ball.x + Math.cos(angle) * BALL_RADIUS;
            const checkY = ball.y + Math.sin(angle) * BALL_RADIUS;

            const squareX = Math.floor(checkX / SQUARE_SIZE);
            const squareY = Math.floor(checkY / SQUARE_SIZE);

            if (squareX >= 0 && squareX < numSquaresX && squareY >= 0 && squareY < numSquaresY) {
               if (squaresRef.current[squareY][squareX] !== ball.reverseColor) {
                  squaresRef.current[squareY][squareX] = ball.reverseColor;

                  const cellCenterX = squareX * SQUARE_SIZE + SQUARE_SIZE / 2;
                  const cellCenterY = squareY * SQUARE_SIZE + SQUARE_SIZE / 2;

                  const dx = ball.x - cellCenterX;
                  const dy = ball.y - cellCenterY;

                  if (Math.abs(dx) > Math.abs(dy)) {
                     ball.dx = -ball.dx;
                  } else {
                     ball.dy = -ball.dy;
                  }

                  return true;
               }
            }
         }
         return false;
      };

      const updateBalls = () => {
         ballsRef.current.forEach((ball) => {
            ball.dx += (Math.random() - 0.5) * 0.02;
            ball.dy += (Math.random() - 0.5) * 0.02;

            ball.dx = clampSpeed(ball.dx);
            ball.dy = clampSpeed(ball.dy);

            ball.x += ball.dx;
            ball.y += ball.dy;

            if (ball.x - BALL_RADIUS <= 0 || ball.x + BALL_RADIUS >= CANVAS_WIDTH) {
               ball.dx = -ball.dx;
               ball.x = Math.max(BALL_RADIUS, Math.min(CANVAS_WIDTH - BALL_RADIUS, ball.x));
            }

            if (ball.y - BALL_RADIUS <= 0 || ball.y + BALL_RADIUS >= CANVAS_HEIGHT) {
               ball.dy = -ball.dy;
               ball.y = Math.max(BALL_RADIUS, Math.min(CANVAS_HEIGHT - BALL_RADIUS, ball.y));
            }

            checkSquareCollision(ball);
         });
      };

      let frameCount = 0;
      const animate = (currentTime: number) => {
         const deltaTime = currentTime - lastUpdateRef.current;

         if (deltaTime >= 10) {
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            drawSquares();
            updateBalls();
            drawBalls();

            frameCount++;
            if (frameCount % 10 === 0) {
               updateScores();
            }

            lastUpdateRef.current = currentTime;
         }

         animationFrameRef.current = requestAnimationFrame(animate);
      };

      animationFrameRef.current = requestAnimationFrame(animate);

      return () => {
         if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
         }
      };
   }, []);

   const totalSquares = 576;
   const dayPercentage = Math.round((dayScore / totalSquares) * 100);
   const nightPercentage = Math.round((nightScore / totalSquares) * 100);

   return (
      <div
         className="min-h-screen flex flex-col items-center justify-center p-8"
         style={{ backgroundColor: '#EEEEEE' }}
      >
         <div className="mb-8 text-center">
            <h1 className="text-5xl font-bold mb-3" style={{ color: COLOR_PALETTE.OceanicNoir }}>
               Humans vs AI: Infinity War
            </h1>
            <p className="text-lg opacity-75" style={{ color: COLOR_PALETTE.NocturnalExpedition }}>
               The eternal battle between AI and Humans
            </p>
         </div>

         <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
            <canvas
               ref={canvasRef}
               width={CANVAS_WIDTH}
               height={CANVAS_HEIGHT}
               className="rounded-lg"
            />
         </div>

         <div className="flex gap-12 mb-4">
            <div
               className="text-center px-8 py-4 rounded-xl shadow-lg"
               style={{ backgroundColor: DAY_COLOR, padding: '1rem 2rem' }}
            >
               <div
                  className="text-sm font-semibold mb-1 opacity-75"
                  style={{ color: DAY_BALL_COLOR }}
               >
                  Humans
               </div>
               <div className="text-3xl font-bold" style={{ color: DAY_BALL_COLOR }}>
                  {dayScore}
               </div>
               <div className="text-sm mt-1" style={{ color: DAY_BALL_COLOR }}>
                  {dayPercentage}%
               </div>
            </div>

            <div
               className="text-center rounded-xl shadow-lg"
               style={{ backgroundColor: NIGHT_COLOR, padding: '1rem 2rem' }}
            >
               <div
                  className="text-sm font-semibold mb-1 opacity-75"
                  style={{ color: NIGHT_BALL_COLOR }}
               >
                  AI
               </div>
               <div className="text-3xl font-bold" style={{ color: NIGHT_BALL_COLOR }}>
                  {nightScore}
               </div>
               <div className="text-sm mt-1" style={{ color: NIGHT_BALL_COLOR }}>
                  {nightPercentage}%
               </div>
            </div>
         </div>

         <div
            className="text-center text-sm opacity-60 mt-4"
            style={{ color: COLOR_PALETTE.NocturnalExpedition }}
         >
            <p>Two balls eternally competing for territorial dominance</p>
         </div>

         <div>
            Made with ❤️ by
            <a
               style={{
                  color: COLOR_PALETTE.DeepSaffron,
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  paddingLeft: '8px'
               }}
               href="https://mohammadnabi.me"
               target="_blank"
               rel="noopener noreferrer"
            >
               Mohammad Nabi
            </a>
         </div>
      </div>
   );
}
