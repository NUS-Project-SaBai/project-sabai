import { IoSearch } from "react-icons/io5";

export default function SearchInput({
  searchText,
  setSearchText,
}: {
  searchText: string;
  setSearchText: (text: string) => void;
}) {
  return (
    <div className="flex flex-row grow bg-neutral-50 border border-neutral-100 rounded-lg">
      <input
        className="bg-neutral-50 focus:outline-none"
        onChange={(e) => setSearchText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setSearchText("");
          }
        }}
        placeholder="Search patients..."
        value={searchText}
      />
      <div className="p-2">
        <IoSearch className="text-neutral-400" />
      </div>
    </div>
  );
}
