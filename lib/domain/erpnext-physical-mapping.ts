import {
  createErpMappingAdapters,
  mapWithErpAdapter,
  type ErpMappingFixture,
} from "./erp-mapping-poc";

export type ErpNextPhysicalSnapshot = {
  item: {
    item_code: string;
    item_name: string;
    item_group: string;
    stock_uom: string;
    disabled: number;
  };
  price: {
    item_code: string;
    price_list: string;
    price_list_rate: number;
    currency: string;
  };
  bin: {
    item_code: string;
    warehouse: string;
    actual_qty: number;
    reserved_qty: number;
  };
  customer: { name: string };
  order: {
    name: string;
    status: string;
    grand_total: number;
    customer: string;
  };
};

export const mapErpNextPhysicalSnapshot = (snapshot: ErpNextPhysicalSnapshot) => {
  const fixture: ErpMappingFixture = {
    product: {
      item_code: snapshot.item.item_code,
      item_name: snapshot.item.item_name,
      item_group: snapshot.item.item_group,
      variants: [{
        item_code: snapshot.price.item_code,
        item_name: snapshot.item.stock_uom,
        standard_rate: snapshot.price.price_list_rate,
      }],
    },
    inventory: snapshot.bin,
    customer: snapshot.customer,
    order: snapshot.order,
  };

  return mapWithErpAdapter(createErpMappingAdapters().erpnext, fixture);
};
