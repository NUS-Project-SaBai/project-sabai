import { IoSearch } from "react-icons/io5";

export default function SearchInput({
  setText,
}: {
  setText: (text: string) => void;
}) {
  return (
    <div className="flex flex-row grow bg-neutral-50 border border-neutral-100 rounded-lg">
      <input
        className="bg-neutral-50 focus:outline-none"
        onChange={(e) => setText(e.target.value)}
        placeholder="Search patients..."
      />
      <button className="p-2">
        <IoSearch className="text-neutral-400" />
      </button>
    </div>
  );
}
