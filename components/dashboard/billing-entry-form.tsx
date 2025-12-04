"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface BillingEntryItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  exchange_rate: number;
  receiving_amount: number;
  line_item: string;
  debit: number;
}

interface BillingEntryFormProps {
  hotelId: string;
  currency: string;
  onEntryAdded?: () => void;
}

export function BillingEntryForm({ hotelId, currency, onEntryAdded }: BillingEntryFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    date: new Date().toISOString().split('T')[0],
    notes: "",
    exchange_rate: 1,
  });

  const [items, setItems] = useState<BillingEntryItem[]>([
    {
      id: "1",
      description: "",
      quantity: 1,
      unit_price: 0,
      exchange_rate: 1,
      receiving_amount: 0,
      line_item: "",
      debit: 0
    }
  ]);

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const totalReceiving = items.reduce((sum, item) => sum + item.receiving_amount, 0);
  const totalDebit = items.reduce((sum, item) => sum + item.debit, 0);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        description: "",
        quantity: 1,
        unit_price: 0,
        exchange_rate: 1,
        receiving_amount: 0,
        line_item: "",
        debit: 0
      }
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (
    id: string,
    field: keyof BillingEntryItem,
    value: string | number
  ) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? { ...item, [field]: value }
          : item
      )
    );
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    // Create billing entries
    for (const item of items) {
      if (item.description && (item.unit_price > 0)) {
        const { error: billingError } = await supabase
          .from("billings")
          .insert({
            hotel_id: hotelId,
            category: item.line_item || "General",
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_amount: item.quantity * item.unit_price,
            date: formData.date,
          });

        if (billingError) {
          console.error("Error creating billing:", billingError);
          setLoading(false);
          alert('Failed to create billing. Please try again.');
          return;
        }
      }
    }

    setLoading(false);
    setFormData({
      name: "",
      date: new Date().toISOString().split('T')[0],
      notes: "",
      exchange_rate: 1,
    });
    setItems([
      {
        id: "1",
        description: "",
        quantity: 1,
        unit_price: 0,
        exchange_rate: 1,
        receiving_amount: 0,
        line_item: "",
        debit: 0
      }
    ]);

    if (onEntryAdded) {
      onEntryAdded();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-white">
        <CardHeader>
          <CardTitle>Add New Billing Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Billing Entry Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Billing Name</Label>
              <Input
                className="border-white"
                id="name"
                placeholder="Enter billing name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                className="border-white"
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Line Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            {items.map((item, index) => (
              <Card key={item.id} className="p-4 border-white">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      className="border-white"
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Line Item</Label>
                    <Input
                      className="border-white"
                      placeholder="Line item type"
                      value={item.line_item}
                      onChange={(e) => updateItem(item.id, "line_item", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      className="border-white"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value) || 1)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Price ({currency})</Label>
                    <Input
                      className="border-white"
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unit_price}
                      onChange={(e) => updateItem(item.id, "unit_price", Number(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Exchange Rate</Label>
                    <Input
                      className="border-white"
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.exchange_rate}
                      onChange={(e) => updateItem(item.id, "exchange_rate", Number(e.target.value) || 1)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Receiving ({currency})</Label>
                    <Input
                      className="border-white"
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.receiving_amount}
                      onChange={(e) => updateItem(item.id, "receiving_amount", Number(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Debit ({currency})</Label>
                    <Input
                      className="border-white"
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.debit}
                      onChange={(e) => updateItem(item.id, "debit", Number(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2 flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Summary */}
          <div className="border border-white rounded-lg p-4 bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="text-xl font-bold">{subtotal.toFixed(2)} {currency}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receiving</p>
                <p className="text-xl font-bold">{totalReceiving.toFixed(2)} {currency}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Debit</p>
                <p className="text-xl font-bold">{totalDebit.toFixed(2)} {currency}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              className="border-white"
              id="notes"
              placeholder="Additional notes about this billing entry..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Billing Entry"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}