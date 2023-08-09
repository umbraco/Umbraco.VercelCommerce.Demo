export type Maybe<T> = T | null;

export type Cart = {
  id: string;
  checkoutUrl: string;
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
    totalTaxAmount: Money;
  };
  totalQuantity: number;
  lines: CartItem[];
};

export type CartItem = {
  id: string;
  quantity: number;
  cost: {
    totalAmount: Money;
  };
  merchandise: {
    id: string;
    title: string;
    selectedOptions: {
      name: string;
      value: string;
    }[];
    product: Product;
  };
};

export type Collection = {
  handle: string;
  title: string;
  path: string;
  description: string;
  seo: SEO;
  updatedAt: string;
};

export type Image = {
  url: string;
  width: number;
  height: number;
  altText: string;
};

export type Menu = {
  title: string;
  path: string;
};

export type Money = {
  amount: string;
  currencyCode: string;
};

export type Page = {
  id: string;
  title: string;
  handle: string;
  body: string;
  bodySummary: string;
  seo: SEO;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  handle: string;
  availableForSale: boolean;
  title: string;
  description: string;
  descriptionHtml: string;
  options: ProductOption[];
  priceRange: {
    maxVariantPrice: Money;
    minVariantPrice: Money;
  };
  featuredImage: Image;
  seo: SEO;
  tags: string[];
  updatedAt: string;
  variants: ProductVariant[];
  images: Image[];
};

export type ProductOption = {
  id: string;
  name: string;
  values: string[];
};

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  selectedOptions: {
    name: string;
    value: string;
  }[];
  price: Money;
};

export type SEO = {
  title: string;
  description: string;
};

export type UmbracoElement = {
  id: string;
  contentType: string;
  properties: { [id: string]: any };
};

export type UmbracoNode = UmbracoElement & {
  name: string;
  route: UmbracoRoute;
  createDate: string;
  updateDate: string;
};

export type UmbracoMedia = {
  id: string;
  name: string;
  mediaType: string;
  url: string;
  extension: string;
  width: number;
  height: number;
  bytes: null;
  properties: { [id: string]: any };
};

export type UmbracoRoute = {
  path: string;
  startItem: UmbracoStartItem;
};

export type UmbracoStartItem = {
  id: string;
  path: string;
};

export type UmbracoCommerceVariantPropertyValue = {
  attributes: UmbracoCommerceInUseAttribute[];
  items: UmbracoCommerceVariantItem[];
};

export type UmbracoCommerceVariantItem = {
  content?: UmbracoElement;
  attributes: { [id: string]: string };
  isDefault: boolean;
};

export type UmbracoCommerceInUseAttribute = UmbracoCommerceAliasNamePair & {
  values: UmbracoCommerceAliasNamePair[];
};

export type UmbracoCommerceOrder = {
  id: string;
  currency: UmbracoCommerceCurrency;
  orderLines: UmbracoCommerceOrderLine[];
  totalQuantity: number;
  subtotalPrice: UmbracoCommerceAdjustedPrice;
  totalPrice: UmbracoCommerceAdjustedPrice;
  properties: { [id: string]: string };
  isFinalized: boolean;
};

export type UmbracoCommerceOrderLine = {
  id: string;
  productReference: string;
  productVariantReference: string;
  sku: string;
  name: string;
  quantity: number;
  totalPrice: UmbracoCommerceAdjustedPrice;
  properties: { [id: string]: string };
  attributes: UmbracoCommerceAttributeCombination[];
};

export type UmbracoCommerceCurrency = {
  id: string;
  code: string;
};

export type UmbracoCommerceAdjustedPrice = {
  value: UmbracoCommercePrice;
};

export type UmbracoCommercePrice = {
  currency: UmbracoCommerceCurrency;
  withoutTax: number;
  tax: number;
  withTax: number;
};

export type UmbracoCommerceAmount = {
  currency: UmbracoCommerceCurrency;
  value: number;
};

export type UmbracoCommerceAttributeCombination = {
  name: UmbracoCommerceAliasNamePair;
  value: UmbracoCommerceAliasNamePair;
};

export type UmbracoCommerceAliasNamePair = {
  alias: string;
  name: string;
};

export type UmbracoPagedResult<T> = {
  total: number;
  items: T[];
};

export type UmbracoLink = {
  url: string;
  title: string;
  target?: string;
  destinationId?: string;
  destinationType?: string;
  route?: UmbracoRoute;
  linkType: string;
};
