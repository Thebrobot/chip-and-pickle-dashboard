"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { createBudgetItem, updateBudgetItem, deleteBudgetItem, togglePaidStatus } from "./actions";

const CATEGORIES = [
  "Hard costs",
  "Soft costs",
  "Equipment",
  "Permits",
  "Marketing",
  "Contingency",
];

interface BudgetItem {
  id: string;
  category: string;
  item_name: string;
  forecast_amount: number | null;
  actual_amount: number | null;
  vendor: string | null;
  notes: string | null;
  paid: boolean;
  paid_date: string | null;
}

interface BudgetClientProps {
  projectId: string;
  projectName: string;
  budgetItems: BudgetItem[];
  openModal?: boolean;
}

function formatCurrency(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function linkifyText(text: string): React.ReactNode {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#0F3D2E] underline hover:text-[#0d3528]"
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function BudgetClient({
  projectId,
  projectName,
  budgetItems,
  openModal = false,
}: BudgetClientProps) {
  const [modalOpen, setModalOpen] = useState(openModal);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid">("all");

  useEffect(() => {
    if (openModal) setModalOpen(true);
  }, [openModal]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [itemName, setItemName] = useState("");
  const [forecastAmount, setForecastAmount] = useState("");
  const [actualAmount, setActualAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const toggleNoteExpansion = (itemId: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Filter items based on search, category, and payment status
  const filteredItems = budgetItems.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;

    const matchesPayment =
      paymentFilter === "all" ||
      (paymentFilter === "paid" && item.paid) ||
      (paymentFilter === "unpaid" && !item.paid);

    return matchesSearch && matchesCategory && matchesPayment;
  });

  const totalForecast = filteredItems.reduce(
    (sum, i) => sum + (i.forecast_amount ?? 0),
    0
  );
  const totalActual = filteredItems.reduce(
    (sum, i) => sum + (i.actual_amount ?? 0),
    0
  );
  const variance = totalActual - totalForecast;

  function resetForm() {
    setCategory(CATEGORIES[0]);
    setItemName("");
    setForecastAmount("");
    setActualAmount("");
    setVendor("");
    setNotes("");
    setError(null);
    setEditingItem(null);
  }

  function handleCloseModal() {
    setModalOpen(false);
    resetForm();
  }

  function handleEditItem(item: BudgetItem) {
    setEditingItem(item);
    setCategory(item.category);
    setItemName(item.item_name);
    setForecastAmount(item.forecast_amount?.toString() ?? "");
    setActualAmount(item.actual_amount?.toString() ?? "");
    setVendor(item.vendor ?? "");
    setNotes(item.notes ?? "");
    setModalOpen(true);
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm("Are you sure you want to delete this budget item?")) return;
    setDeletingId(itemId);
    try {
      await deleteBudgetItem(itemId);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete item");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleTogglePaid(itemId: string, currentStatus: boolean) {
    try {
      await togglePaidStatus(itemId, !currentStatus);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update payment status");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!itemName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const forecast = forecastAmount.trim()
        ? parseFloat(forecastAmount)
        : null;
      const actual = actualAmount.trim() ? parseFloat(actualAmount) : null;
      if (forecastAmount.trim() && (isNaN(forecast!) || forecast! < 0)) {
        throw new Error("Forecast amount must be a valid number");
      }
      if (actualAmount.trim() && (isNaN(actual!) || actual! < 0)) {
        throw new Error("Actual amount must be a valid number");
      }

      const data = {
        category,
        item_name: itemName.trim(),
        forecast_amount: forecast,
        actual_amount: actual,
        vendor: vendor.trim() || null,
        notes: notes.trim() || null,
      };

      if (editingItem) {
        await updateBudgetItem(editingItem.id, data);
      } else {
        await createBudgetItem(projectId, data);
      }

      handleCloseModal();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${editingItem ? "update" : "create"} item`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Budget"
        subtitle={`Monitor spending for ${projectName}`}
        action={<Button onClick={() => { resetForm(); setModalOpen(true); }}>Add Budget Item</Button>}
      />

      <section className="grid gap-8 sm:grid-cols-3">
        <div className="kpi-card">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Total Forecast
            </p>
            <p className="text-4xl font-semibold tabular-nums text-slate-900">
              {formatCurrency(totalForecast)}
            </p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Total Actual
            </p>
            <p className="text-4xl font-semibold tabular-nums text-slate-900">
              {formatCurrency(totalActual)}
            </p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Variance
            </p>
            <p
              className={`text-4xl font-semibold tabular-nums ${
                variance === 0
                  ? "text-slate-600"
                  : variance > 0
                    ? "text-red-600"
                    : "text-emerald-600"
              }`}
            >
              {formatCurrency(variance)}
            </p>
            <p className="text-xs text-slate-500">
              {variance === 0
                ? "On budget"
                : variance > 0
                  ? "Over budget"
                  : "Under budget"}
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filter */}
      {budgetItems.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by item, category, vendor, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-base w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <label className="shrink-0 text-sm font-medium text-slate-700">
                Category:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-base min-w-[160px]"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setPaymentFilter("all")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                paymentFilter === "all"
                  ? "bg-[#0F3D2E] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setPaymentFilter("paid")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                paymentFilter === "paid"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => setPaymentFilter("unpaid")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                paymentFilter === "unpaid"
                  ? "bg-amber-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Unpaid
            </button>
          </div>
        </section>
      )}

      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Edit Budget Item" : "Add Budget Item"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label
              htmlFor="budget-category"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Category
            </label>
            <select
              id="budget-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="input-base"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="budget-item-name"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Item name
            </label>
            <input
              id="budget-item-name"
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
              placeholder="e.g. Kitchen cabinets"
              className="input-base"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="budget-forecast"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Forecast amount ($)
              </label>
              <input
                id="budget-forecast"
                type="number"
                min="0"
                step="0.01"
                value={forecastAmount}
                onChange={(e) => setForecastAmount(e.target.value)}
                placeholder="0"
                className="input-base"
              />
            </div>
            <div>
              <label
                htmlFor="budget-actual"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Actual amount ($)
              </label>
              <input
                id="budget-actual"
                type="number"
                min="0"
                step="0.01"
                value={actualAmount}
                onChange={(e) => setActualAmount(e.target.value)}
                placeholder="0"
                className="input-base"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="budget-vendor"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Vendor
            </label>
            <input
              id="budget-vendor"
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="Optional"
              className="input-base"
            />
          </div>
          <div>
            <label
              htmlFor="budget-notes"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Notes
            </label>
            <textarea
              id="budget-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional (URLs will be clickable)"
              rows={3}
              className="input-base resize-none"
            />
            <p className="mt-1 text-xs text-slate-500">
              Tip: Paste URLs and they'll become clickable links
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting 
                ? (editingItem ? "Saving..." : "Adding...") 
                : (editingItem ? "Save Changes" : "Add Item")}
            </Button>
          </div>
        </form>
      </Modal>

      <section>
        {budgetItems.length === 0 ? (
          <div className="card flex flex-col items-center justify-center px-8 py-16 text-center">
            <div className="rounded-full bg-slate-100 p-4">
              <svg
                className="h-8 w-8 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-slate-900">
              No budget items yet
            </h3>
            <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">
              Add your first budget item to track forecast and actual costs.
            </p>
            <Button onClick={() => { resetForm(); setModalOpen(true); }} className="mt-6">
              Add Budget Item
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="card flex flex-col items-center justify-center px-8 py-12 text-center">
            <svg
              className="h-12 w-12 text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="mt-4 text-base font-medium text-slate-900">
              No items match your search
            </h3>
            <p className="mt-1.5 text-sm text-slate-500">
              Try adjusting your search or filter criteria
            </p>
            <div className="mt-4 flex gap-2">
              {searchQuery && (
                <Button
                  variant="secondary"
                  onClick={() => setSearchQuery("")}
                >
                  Clear Search
                </Button>
              )}
              {selectedCategory !== "All" && (
                <Button
                  variant="secondary"
                  onClick={() => setSelectedCategory("All")}
                >
                  Clear Category
                </Button>
              )}
              {paymentFilter !== "all" && (
                <Button
                  variant="secondary"
                  onClick={() => setPaymentFilter("all")}
                >
                  Show All Items
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-sm text-slate-600">
                Showing {filteredItems.length} of {budgetItems.length} {budgetItems.length === 1 ? "item" : "items"}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => {
              const variance = (item.actual_amount ?? 0) - (item.forecast_amount ?? 0);
              const isExpanded = expandedNotes.has(item.id);
              const hasLongNotes = (item.notes?.length ?? 0) > 100;
              
              return (
                <div key={item.id} className="card overflow-hidden flex flex-col">
                  <div className="bg-gradient-to-br from-[#0F3D2E] to-[#0d3528] px-5 py-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-white break-words line-clamp-2">
                          {item.item_name}
                        </h3>
                        <p className="mt-0.5 text-xs text-white/80">
                          {item.category}
                        </p>
                      </div>
                      {item.paid && (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2 py-1 text-xs font-medium text-emerald-100">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Paid
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-4 space-y-3">
                    {/* Amounts Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                          Forecast
                        </p>
                        <p className="mt-0.5 font-mono text-base font-semibold text-slate-900">
                          {formatCurrency(item.forecast_amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                          Actual
                        </p>
                        <p className="mt-0.5 font-mono text-base font-semibold text-slate-900">
                          {formatCurrency(item.actual_amount)}
                        </p>
                      </div>
                    </div>

                    {/* Variance */}
                    {(item.forecast_amount !== null || item.actual_amount !== null) && (
                      <div className={`rounded-lg px-2.5 py-1.5 ${
                        variance === 0
                          ? "bg-slate-100"
                          : variance > 0
                            ? "bg-red-50"
                            : "bg-emerald-50"
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium uppercase tracking-wider text-slate-600">
                            Variance
                          </span>
                          <span className={`font-mono text-sm font-semibold ${
                            variance === 0
                              ? "text-slate-700"
                              : variance > 0
                                ? "text-red-700"
                                : "text-emerald-700"
                          }`}>
                            {variance > 0 ? "+" : ""}{formatCurrency(Math.abs(variance))}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Vendor */}
                    {item.vendor && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                          Vendor
                        </p>
                        <p className="mt-0.5 text-sm text-slate-700 break-words line-clamp-1">
                          {item.vendor}
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    {item.notes && (
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                            Notes
                          </p>
                          {hasLongNotes && (
                            <button
                              onClick={() => toggleNoteExpansion(item.id)}
                              className="flex items-center gap-1 text-xs font-medium text-[#0F3D2E] hover:text-[#0d3528]"
                            >
                              {isExpanded ? (
                                <>
                                  Show Less
                                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </>
                              ) : (
                                <>
                                  Show More
                                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        <p className={`text-sm text-slate-700 leading-relaxed break-words ${
                          !isExpanded && hasLongNotes ? 'line-clamp-2' : ''
                        }`}>
                          {linkifyText(item.notes)}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-2 border-t border-slate-100 pt-3 mt-auto">
                      <button
                        onClick={() => handleTogglePaid(item.id, item.paid)}
                        className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                          item.paid
                            ? "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        {item.paid ? "Mark as Unpaid" : "Mark as Paid"}
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="btn-secondary flex-1 py-1.5 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={deletingId === item.id}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                        >
                          {deletingId === item.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
