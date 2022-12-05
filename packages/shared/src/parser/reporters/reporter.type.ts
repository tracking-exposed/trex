export interface ErrorReporter<E = unknown> {
  report: (e: E) => void;
}
