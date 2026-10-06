"use client";

import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const TableSearch = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState(
    searchParams.get("search") || ""
  );

  useEffect(() => {
    const delay = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (search) {
        params.set("search", search);
      } else {
        params.delete("search");
      }

      params.set("page", "1");

      router.push(`?${params.toString()}`);
    }, 500);

    return () => clearTimeout(delay);
  }, [search]);

  return (
    <div className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2">
      <Image
        src="/search.png"
        alt="search"
        height={14}
        width={14}
      />

      <input
        type="text"
        placeholder="search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="outline-none p-2 w-[200px] bg-transparent"
      />
    </div>
  );
};

export default TableSearch;