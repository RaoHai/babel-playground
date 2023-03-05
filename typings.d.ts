declare module '*.css';
declare module '*.png';

declare interface Window {
  __executeErrorCallback: (e: Error) => void;
}