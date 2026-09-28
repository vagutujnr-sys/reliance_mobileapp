"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

type FilterOption = { value: string; label: string };

type AdminDataTableProps = {
  headings: string[];
  rows: ReactNode[];
  searchValues: string[];
  filterValues: string[];
  filterLabel: string;
  filters: FilterOption[];
  emptyMessage?: string;
};

const pageSize = 5;

export function AdminDataTable({ headings, rows, searchValues, filterValues, filterLabel, filters, emptyMessage = "No records found." }: AdminDataTableProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const matches = rows.flatMap((row, index) => {
    const searchMatch = (searchValues[index] ?? "").toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
    const filterMatch = filter === "all" || filterValues[index] === filter;
    return searchMatch && filterMatch ? [{ row, index }] : [];
  });
  const pageCount = Math.ceil(matches.length / pageSize);
  const pageRows = matches.slice(page * pageSize, (page + 1) * pageSize);
  const firstRecord = matches.length ? page * pageSize + 1 : 0;
  const lastRecord = Math.min((page + 1) * pageSize, matches.length);

  function updateQuery(value: string) {
    setQuery(value);
    setPage(0);
  }

  function updateFilter(value: string) {
    setFilter(value);
    setPage(0);
  }

  return (
    <section className="border border-line bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5">
        <label className="relative min-w-48 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Search records" aria-label="Search table records" className="h-9 w-full border border-line pl-8 pr-2 text-sm outline-none focus:border-brand" />
        </label>
        <label className="flex items-center gap-2 text-xs text-muted">
          <span>{filterLabel}</span>
          <select value={filter} onChange={(event) => updateFilter(event.target.value)} aria-label={`Filter by ${filterLabel.toLowerCase()}`} className="h-9 min-w-32 border border-line bg-white px-2 text-sm text-ink outline-none focus:border-brand">
            <option value="all">All</option>
            {filters.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <span className="ml-auto text-xs text-muted">{matches.length} {matches.length === 1 ? "record" : "records"}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
          <thead className="bg-[#f1f3f5] text-xs font-semibold uppercase text-muted">
            <tr>{headings.map((heading) => <th key={heading} scope="col" className="whitespace-nowrap px-3 py-2.5">{heading}</th>)}</tr>
          </thead>
          <tbody>
            {pageRows.map(({ row }) => row)}
            {!pageRows.length ? <tr><td colSpan={headings.length} className="px-3 py-8 text-center text-sm text-muted">{emptyMessage}</td></tr> : null}
          </tbody>
        </table>
      </div>
      <footer className="flex items-center justify-between border-t border-line px-3 py-2">
        <span className="text-xs text-muted">Showing {firstRecord}–{lastRecord} of {matches.length}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Page {pageCount ? page + 1 : 0} of {pageCount}</span>
          <button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0} aria-label="Previous page" className="grid h-8 w-8 place-items-center border border-line disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={page >= pageCount - 1} aria-label="Next page" className="grid h-8 w-8 place-items-center border border-line disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </footer>
    </section>
  );
}
