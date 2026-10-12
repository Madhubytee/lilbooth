interface Props {
  count: number | null;
  /** bump to fire the white flash */
  flashKey: number;
}

export default function Countdown({ count, flashKey }: Props) {
  return (
    <>
      {count !== null && (
        <div className="countdown" aria-hidden="true">
          <span key={count} className="countdown-num">
            {count}
          </span>
        </div>
      )}
      {flashKey > 0 && <div key={flashKey} className="flash" aria-hidden="true" />}
      <span className="sr-only" aria-live="assertive">
        {count !== null ? String(count) : ''}
      </span>
    </>
  );
}
