import React, { useState } from 'react';
import { useMess } from '../../context/MessContext';
import {
  UtensilsCrossed,
  ListPlus,
  ShoppingCart,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  Edit2
} from 'lucide-react';
import { AddShoppingItemModal } from '../modals/AddShoppingItemModal';
import { AddBazarModal } from '../modals/AddBazarModal';
import { roundMoney } from '../../services/accountingEngine';

export const MealShoppingView: React.FC = () => {
  const {
    state,
    currentUser,
    saveMealPlan,
    toggleShoppingItem,
    deleteShoppingItem,
    convertShoppingToBazar
  } = useMess();

  const [isAddShoppingOpen, setIsAddShoppingOpen] = useState(false);
  const [isBazarModalOpen, setIsBazarModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Meal Plan Editing state
  const selectedDate = '2026-09-25';
  const currentPlan = state.mealPlans.find((m) => m.date === selectedDate) || {
    breakfast: 'Paratha + Egg Omelette + Tea',
    lunch: 'Steamed Rice + Rui Fish Curry + Dal',
    dinner: 'Rice + Chicken Bhuna + Mixed Vegetable',
    note: ''
  };

  const [breakfast, setBreakfast] = useState(currentPlan.breakfast);
  const [lunch, setLunch] = useState(currentPlan.lunch);
  const [dinner, setDinner] = useState(currentPlan.dinner);
  const [mealNote, setMealNote] = useState(currentPlan.note || '');
  const [isMealSaved, setIsMealSaved] = useState(false);

  const handleSaveMeal = (e: React.FormEvent) => {
    e.preventDefault();
    saveMealPlan(selectedDate, breakfast, lunch, dinner, mealNote);
    setIsMealSaved(true);
    setTimeout(() => setIsMealSaved(false), 2000);
  };

  // Convert selected pending shopping items directly to Bazar expense (Section 49)
  const pendingShoppingItems = state.shoppingList.filter((i) => i.status === 'PENDING');

  const handleConvertAllPendingToBazar = () => {
    if (pendingShoppingItems.length === 0) {
      alert('No pending shopping items to convert');
      return;
    }

    const itemsToConvert = pendingShoppingItems.map((item) => ({
      itemName: item.itemName,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.estimatedCost ? Math.round(item.estimatedCost / item.quantity) : 100
    }));

    convertShoppingToBazar(
      itemsToConvert,
      currentUser.id,
      'Dhanmondi Raw Market',
      new Date().toISOString().split('T')[0],
      'Converted from upcoming shopping list items'
    );

    alert(`Successfully converted ${itemsToConvert.length} shopping items into a recorded Bazar Expense!`);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Meals & Shopping
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Daily cooking menu and shopping list
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingItem(null);
              setIsAddShoppingOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <ListPlus className="w-3.5 h-3.5" />
            <span>+ Add Item</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Today's Cooking / Meal Plan */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900">
                  Daily Meal Plan
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">{selectedDate}</span>
            </div>

            <form onSubmit={handleSaveMeal} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wide mb-1 text-[11px]">
                  Breakfast
                </label>
                <input
                  type="text"
                  value={breakfast}
                  onChange={(e) => setBreakfast(e.target.value)}
                  placeholder="e.g. Paratha + Egg Omelette + Tea"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wide mb-1 text-[11px]">
                  Lunch
                </label>
                <input
                  type="text"
                  value={lunch}
                  onChange={(e) => setLunch(e.target.value)}
                  placeholder="e.g. Steamed Rice + Rui Fish Curry + Dal"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wide mb-1 text-[11px]">
                  Dinner
                </label>
                <input
                  type="text"
                  value={dinner}
                  onChange={(e) => setDinner(e.target.value)}
                  placeholder="e.g. Rice + Chicken Bhuna + Mixed Vegetable"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wide mb-1 text-[11px]">
                  Special Instructions
                </label>
                <input
                  type="text"
                  value={mealNote}
                  onChange={(e) => setMealNote(e.target.value)}
                  placeholder="e.g. Cook at 12:30 PM"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                {isMealSaved && (
                  <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                  </span>
                )}
                <button
                  type="submit"
                  className="ml-auto px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Save Meal Plan
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Shopping List & 1-Click Bazar Expense Integration */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Shopping List ({state.shoppingList.length})
                </h2>
              </div>

              {pendingShoppingItems.length > 0 && (
                <button
                  onClick={handleConvertAllPendingToBazar}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors shadow-2xs self-start sm:self-auto"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Convert to Bazar Expense</span>
                </button>
              )}
            </div>

            {/* Shopping items list */}
            <div className="space-y-2">
              {state.shoppingList.map((item) => {
                const isPurchased = item.status === 'PURCHASED';

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isPurchased
                        ? 'bg-slate-50/70 border-slate-200 text-slate-400 line-through'
                        : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isPurchased}
                        onChange={() => toggleShoppingItem(item.id)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-800 w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900">
                            {item.itemName}
                          </span>
                          <span className="text-xs font-medium text-slate-600">
                            — {item.quantity} {item.unit}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                              item.priority === 'HIGH'
                                ? 'bg-rose-100 text-rose-800'
                                : item.priority === 'MEDIUM'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>
                        {item.note && (
                          <div className="text-[11px] text-slate-500 mt-0.5">{item.note}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.estimatedCost && (
                        <span className="text-xs font-semibold tabular-nums text-slate-700">
                          ~৳{item.estimatedCost}
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setIsAddShoppingOpen(true);
                        }}
                        className="text-slate-400 hover:text-blue-600 p-1 rounded transition-colors"
                        title="Edit item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteShoppingItem(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                        title="Delete item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explanatory callout */}
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>"Convert to Bazar" automatically saves pending items as a recorded bazar expense.</span>
            </div>
          </div>
        </div>
      </div>

      <AddShoppingItemModal
        isOpen={isAddShoppingOpen}
        onClose={() => {
          setIsAddShoppingOpen(false);
          setEditingItem(null);
        }}
        initialData={editingItem}
      />
    </div>
  );
};
