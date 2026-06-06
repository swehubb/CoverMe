export default function Panel({ children, className = '', elevated, flush, ticks, style, onClick }) {
  const classes = [
    'panel',
    elevated ? 'elevated' : '',
    flush    ? 'flush'    : '',
    ticks    ? 'ticks'    : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} style={style} onClick={onClick}>
      {ticks && (
        <>
          <span className="tick-bl" />
          <span className="tick-br" />
        </>
      )}
      {children}
    </div>
  );
}
