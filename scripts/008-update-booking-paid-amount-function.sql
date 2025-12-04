-- Function to update the paid amount on a booking based on its payments
CREATE OR REPLACE FUNCTION public.update_booking_paid_amount(p_booking_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the booking's paid_amount based on the sum of completed payments
  UPDATE public.bookings
  SET paid_amount = COALESCE(
    (SELECT SUM(amount)
     FROM public.payments
     WHERE booking_id = p_booking_id
       AND status = 'completed'),
    0
  )
  WHERE id = p_booking_id;
END;
$$;

-- Create a trigger to automatically update the paid amount when payments are inserted/updated
CREATE OR REPLACE FUNCTION public.update_booking_paid_amount_on_payment_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the booking's paid amount after insert/update/delete on payments
  PERFORM update_booking_paid_amount(COALESCE(NEW.booking_id, OLD.booking_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for payment table
DROP TRIGGER IF EXISTS update_booking_paid_amount_on_insert ON public.payments;
DROP TRIGGER IF EXISTS update_booking_paid_amount_on_update ON public.payments;
DROP TRIGGER IF EXISTS update_booking_paid_amount_on_delete ON public.payments;

CREATE TRIGGER update_booking_paid_amount_on_insert
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_paid_amount_on_payment_change();

CREATE TRIGGER update_booking_paid_amount_on_update
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_paid_amount_on_payment_change();

CREATE TRIGGER update_booking_paid_amount_on_delete
  AFTER DELETE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_paid_amount_on_payment_change();