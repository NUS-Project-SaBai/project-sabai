import { IoSearch } from "react-icons/io5";

export default function SearchInput({
  searchText,
  setSearchText,
  placeholder = "Search patients...",
  className = "",
  inputClassName = "",
}: {
  searchText: string;
  setSearchText: (text: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}) {
  return (
    <div
      className={`flex flex-row grow bg-neutral-50 border border-neutral-100 rounded-lg ${className}`}
    >
      <input
        className={`bg-neutral-50 focus:outline-none ${inputClassName}`}
        onChange={(e) => setSearchText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setSearchText("");
          }
        }}
        placeholder={placeholder}
        value={searchText}
      />
      <div className="p-2">
        <IoSearch className="text-neutral-400" />
      </div>
    </div>
  );
}
