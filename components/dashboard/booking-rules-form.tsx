"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Minus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BookingRule } from "@/lib/types";
import type { Hotel } from "@/lib/types";

interface BookingRulesFormProps {
  hotel: Hotel;
}

export function BookingRulesForm({ hotel }: BookingRulesFormProps) {
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<BookingRule[]>([]);
  const [ruleForm, setRuleForm] = useState({
    name: "",
    rule: "",
    applies_to_all_units: true,
  });
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Fetch existing rules
  useEffect(() => {
    const fetchRules = async () => {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("booking_rules")
        .select("*")
        .eq("hotel_id", hotel.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching booking rules:", error);
      } else {
        setRules(data || []);
      }
      setLoading(false);
    };

    if (hotel?.id) {
      fetchRules();
    }
  }, [hotel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    try {
      if (editingRuleId) {
        // Update existing rule
        const { error } = await supabase
          .from("booking_rules")
          .update({
            ...ruleForm,
          })
          .eq("id", editingRuleId);

        if (error) throw error;
      } else {
        // Create new rule
        const { error } = await supabase
          .from("booking_rules")
          .insert({
            ...ruleForm,
            hotel_id: hotel.id,
          });

        if (error) throw error;
      }

      // Refresh the rules list
      const { data, error } = await supabase
        .from("booking_rules")
        .select("*")
        .eq("hotel_id", hotel.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRules(data);
      resetForm();
    } catch (error) {
      console.error("Error saving booking rule:", error);
      // Optionally show an error message to the user
    }
  };

  const handleEdit = (rule: BookingRule) => {
    setRuleForm({
      name: rule.name,
      rule: rule.rule,
      applies_to_all_units: rule.applies_to_all_units,
    });
    setEditingRuleId(rule.id);
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();

    const { error } = await supabase
      .from("booking_rules")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting booking rule:", error);
      return;
    }

    setRules(rules.filter(rule => rule.id !== id));
  };

  const resetForm = () => {
    setRuleForm({
      name: "",
      rule: "",
      applies_to_all_units: true,
    });
    setEditingRuleId(null);
  };

  return (
    <div className="space-y-6">
      <Card className="border-white">
        <CardHeader>
          <CardTitle>Booking Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                value={ruleForm.name}
                onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                placeholder="e.g., Cancellation Policy"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule">Rule</Label>
              <Textarea
                id="rule"
                value={ruleForm.rule}
                onChange={(e) => setRuleForm({ ...ruleForm, rule: e.target.value })}
                placeholder="Enter the booking rule..."
                rows={3}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="applies_to_all_units"
                checked={ruleForm.applies_to_all_units}
                onChange={(e) => setRuleForm({ ...ruleForm, applies_to_all_units: e.target.checked })}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <Label htmlFor="applies_to_all_units">Applies to all units</Label>
            </div>

            <Button type="submit" className="w-full sm:w-auto">
              {editingRuleId ? "Update Rule" : "Add Rule"}
            </Button>

            {editingRuleId && (
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="w-full sm:w-auto ml-2"
              >
                Cancel
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Rules List */}
      <Card className="border-white">
        <CardHeader>
          <CardTitle>Current Booking Rules</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-300"></div>
            </div>
          ) : rules.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No booking rules configured yet.
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="rounded-lg border border-white p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{rule.name}</h3>
                        {rule.applies_to_all_units ? (
                          <Badge variant="secondary">All Units</Badge>
                        ) : (
                          <Badge variant="outline">Specific Units</Badge>
                        )}
                      </div>

                      <p className="mt-2 text-sm">{rule.rule}</p>
                    </div>

                    <div className="mt-2 flex space-x-2 sm:mt-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(rule)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(rule.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}