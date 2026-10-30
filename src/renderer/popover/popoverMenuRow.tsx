type PopoverMenuRowProps = {
  label: string;
  shortcut?: string;
  onSelect: () => void;
};

export function PopoverMenuRow({
  label,
  shortcut,
  onSelect,
}: PopoverMenuRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex h-6.5 cursor-default items-center justify-between rounded-row px-2 text-left text-ui hover:bg-hover"
    >
      {label}
      {shortcut ? (
        <kbd className="font-sans text-caption text-fog">{shortcut}</kbd>
      ) : null}
    </button>
  );
}
