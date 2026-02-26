-- 1. Function to deduct stock when a new order item is created
CREATE OR REPLACE FUNCTION public.handle_new_order_item()
RETURNS TRIGGER AS $$
BEGIN
    -- Deduct from Variants ONLY (Safe check)
    IF NEW.selected_size IS NOT NULL AND NEW.selected_color IS NOT NULL THEN
        UPDATE public.product_variants
        SET quantity = quantity - NEW.quantity
        WHERE product_id = NEW.product_id 
        AND size = NEW.selected_size 
        AND color_name = NEW.selected_color;
    END IF;
    -- NOTE: We removed the ELSE block for simple products because the 'products' table 
    -- does not have a 'quantity' column anymore.

    -- Mark the parent order as having stock deducted
    UPDATE public.orders
    SET is_stock_deducted = TRUE
    WHERE id = NEW.order_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger for INSERT on order_items
DROP TRIGGER IF EXISTS on_order_item_created ON public.order_items;
CREATE TRIGGER on_order_item_created
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_order_item();

-- 3. Function to handle order status changes (Cancel/Restore)
CREATE OR REPLACE FUNCTION public.handle_order_status_update()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    -- CASE 1: Order Cancelled -> Restore Stock
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        -- Loop through items to restore
        FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
            IF item.selected_size IS NOT NULL AND item.selected_color IS NOT NULL THEN
                UPDATE public.product_variants
                SET quantity = quantity + item.quantity
                WHERE product_id = item.product_id 
                AND size = item.selected_size 
                AND color_name = item.selected_color;
            END IF;
            -- Removed simple product logic here too
        END LOOP;
        
        NEW.is_stock_deducted := FALSE;
    END IF;

    -- CASE 2: Order Reactivated (from Cancelled) -> Deduct Stock
    IF OLD.status = 'cancelled' AND NEW.status != 'cancelled' THEN
        -- Loop through items to deduct
        FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
            IF item.selected_size IS NOT NULL AND item.selected_color IS NOT NULL THEN
                UPDATE public.product_variants
                SET quantity = quantity - item.quantity
                WHERE product_id = item.product_id 
                AND size = item.selected_size 
                AND color_name = item.selected_color;
            END IF;
            -- Removed simple product logic here too
        END LOOP;
        
        NEW.is_stock_deducted := TRUE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger for UPDATE on orders
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_status_update();
