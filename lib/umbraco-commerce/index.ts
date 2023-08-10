import { isUmbracoError } from 'lib/type-guards';

import {
  Cart,
  CartItem,
  Collection,
  Image,
  Menu,
  Money,
  Page,
  Product,
  ProductOption,
  ProductVariant,
  UmbracoCommerceAdjustedPrice,
  UmbracoCommerceAmount,
  UmbracoCommerceOrder,
  UmbracoCommerceOrderLine,
  UmbracoCommercePrice,
  UmbracoCommerceVariantPropertyValue,
  UmbracoLink,
  UmbracoMedia,
  UmbracoNode,
  UmbracoPagedResult
} from './types';

import {
  DEFAULT_OPTION,
  TAGS,
  UMBRACO_COMMERCE_API_ENDPOINT,
  UMBRACO_CONTENT_API_ENDPOINT
} from 'lib/constants';
import { revalidateTag } from 'next/cache';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const domain = process.env.UMBRACO_BASE_URL!;
const store_alias = process.env.UMBRACO_COMMERCE_STORE_ALIAS!;

const apis: { [key: string]: any } = {
  content: {
    endpoint: `${domain}${UMBRACO_CONTENT_API_ENDPOINT}`,
    api_key: process.env.UMBRACO_CONTENT_API_KEY!
  },
  commerce: {
    endpoint: `${domain}${UMBRACO_COMMERCE_API_ENDPOINT}`,
    api_key: process.env.UMBRACO_COMMERCE_API_KEY!
  }
};

export async function umbracoFetch<T>(
  api: string,
  opts: {
    method: string;
    path: string;
    query?: Record<string, string | string[]>;
    headers?: HeadersInit;
    cache?: RequestCache;
    tags?: string[];
    payload?: any | undefined;
  }
): Promise<{ status: number; body: T } | never> {
  try {
    const options: RequestInit = {
      method: opts.method,
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apis[api].api_key,
        ...opts.headers
      },
      cache: opts.cache,
      ...(opts.tags && { next: { tags: opts.tags } })
    };

    if (opts.payload) {
      options.body = JSON.stringify(opts.payload);
    }

    let url = apis[api].endpoint + opts.path;

    //console.log(url);
    //console.log(opts);

    if (opts.query) {
      const searchParams = new URLSearchParams();

      Object.entries(opts.query).forEach(([key, values]) => {
        if (Array.isArray(values)) {
          values.forEach((value) => {
            searchParams.append(key, value);
          });
        } else {
          searchParams.append(key, values);
        }
      });

      url += url.indexOf('?') >= 0 ? '&' : '?';
      url += searchParams.toString();
    }

    const result = await fetch(url, options);

    //const txt = await result.text();

    //console.log(txt)

    const body = await result.json();

    //console.log(body)

    if (body.errors) {
      console.log(body.errors);
      throw body.errors[0];
    }

    return {
      status: result.status,
      body
    };
  } catch (e) {
    if (isUmbracoError(e)) {
      throw {
        status: e.status || 500,
        message: e.message
      };
    }

    throw {
      error: e
    };
  }
}

export async function umbracoContentFetch<T>(opts: {
  method: string;
  path: string;
  query?: Record<string, string | string[]>;
  headers?: HeadersInit;
  cache?: RequestCache;
  tags?: string[];
  payload?: any | undefined;
}): Promise<{ status: number; body: T } | never> {
  return await umbracoFetch<T>('content', opts);
}

export async function umbracoCommerceFetch<T>(opts: {
  method: string;
  path: string;
  query?: Record<string, string | string[]>;
  headers?: HeadersInit;
  cache?: RequestCache;
  tags?: string[];
  payload?: any | undefined;
}): Promise<{ status: number; body: T } | never> {
  opts.headers = {
    Store: store_alias,
    ...opts.headers
  };

  return await umbracoFetch<T>('commerce', opts);
}

const reshapeImage = (img: UmbracoMedia): Image => {
  return {
    url: img.url.indexOf('http') == 0 ? img.url : `${domain}${img.url}`,
    altText: img.properties['altText'] || img.name,
    width: img.width,
    height: img.height
  };
};

const reshapeAdjustedPrice = (price: UmbracoCommerceAdjustedPrice): Money =>
  reshapePrice(price.value);

const reshapePrice = (price: UmbracoCommercePrice): Money => {
  return {
    amount: price.withTax.toString(),
    currencyCode: price.currency.code
  };
};

const reshapeAmount = (amount: UmbracoCommerceAmount): Money => {
  return {
    amount: amount.value.toString(),
    currencyCode: amount.currency.code
  };
};

const reshapeOrder = (order: UmbracoCommerceOrder): Cart => {
  return {
    id: order.id,
    checkoutUrl: `${domain}/checkout?id=${order.id}`,
    totalQuantity: order.totalQuantity,
    cost: {
      subtotalAmount: reshapeAdjustedPrice(order.subtotalPrice),
      totalAmount: reshapeAdjustedPrice(order.totalPrice),
      totalTaxAmount: {
        amount: order.totalPrice.value.tax.toString(),
        currencyCode: order.totalPrice.value.currency.code
      }
    },
    lines: order?.orderLines?.map((item) => reshapeOrderLine(item)) || []
  };
};

const reshapeOrderLine = (orderLine: UmbracoCommerceOrderLine): CartItem => {
  var imgUrl = orderLine.properties ? orderLine.properties['imageUrl'] : undefined;

  var title = orderLine.attributes
    ? orderLine.attributes.map((attr) => `${attr.name.name}:${attr.value.name}`).join(', ')
    : DEFAULT_OPTION;

  return {
    id: orderLine.id, // [Required]
    merchandise: {
      id: orderLine.productReference, // [Required]
      title: title,
      selectedOptions:
        orderLine.attributes?.map((attr) => ({
          // [Required]
          name: attr.name.alias,
          value: attr.value.alias
        })) || [],
      product: {
        id: orderLine.productReference,
        handle: orderLine.productReference, // [Required]
        availableForSale: true,
        title: orderLine.name, // [Required]
        description: '',
        descriptionHtml: '',
        options: [],
        priceRange: {
          maxVariantPrice: {
            amount: orderLine.totalPrice.value.withTax.toString(),
            currencyCode: orderLine.totalPrice.value.currency.code
          },
          minVariantPrice: {
            amount: orderLine.totalPrice.value.withTax.toString(),
            currencyCode: orderLine.totalPrice.value.currency.code
          }
        },
        featuredImage: {
          // [Required]
          url: imgUrl ? (imgUrl.indexOf('http') == 0 ? imgUrl : `${domain}${imgUrl}`) : '',
          altText: orderLine.name,
          width: 0,
          height: 0
        },
        seo: {
          title: '',
          description: ''
        },
        tags: [],
        updatedAt: new Date().toISOString(),
        variants: [],
        images: []
      }
    },
    quantity: orderLine.quantity, // [Required]
    cost: {
      // [Required]
      totalAmount: reshapeAdjustedPrice(orderLine.totalPrice)
    }
  };
};

const reshapeCollection = (node: UmbracoNode): Collection | undefined => {
  if (!node) {
    return undefined;
  }

  let nodeAlias = node.route.path
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .pop();
  let nodeHandle = nodeAlias || node.id;

  let metaTitle = node.properties['metaTitle']?.toString() || node.name;
  let metaDescription = node.properties['metaDescription']?.toString();

  return {
    handle: nodeHandle,
    title: node.name,
    description: node.properties['description']?.toString(),
    seo: {
      title: metaTitle,
      description: metaDescription
    },
    path: `/search/${nodeHandle}`,
    updatedAt: node.updateDate
  };
};

const reshapeCollections = (nodes: UmbracoNode[]): Collection[] => {
  return <Collection[]>(nodes || []).map((n) => reshapeCollection(n)).filter((n) => !!n);
};

const reshapeProduct = (
  node: UmbracoNode,
  filterHiddenProducts: boolean = true
): Product | undefined => {
  if (
    !node ||
    (filterHiddenProducts &&
      node.properties['umbracoNaviHide'] &&
      node.properties['umbracoNaviHide'] === true)
  ) {
    return undefined;
  }

  let nodeAlias = node.route.path
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .pop();
  let nodeHandle = nodeAlias || node.id;

  let currency = 'USD';
  let minPrice = 0;
  let maxPrice = 0;

  let metaTitle = node.properties['metaTitle']?.toString() || node.name;
  let metaDescription = node.properties['metaDescription']?.toString();

  let product = <Product>{
    id: node.id,
    handle: nodeHandle,
    title: node.name,
    description: node.properties['shortDescription'],
    descriptionHtml: node.properties['longDescription']?.markup,
    availableForSale: (node.properties['stock'] as number) > 0,
    seo: {
      title: metaTitle,
      description: metaDescription
    },
    options: <ProductOption[]>[],
    variants: <ProductVariant[]>[],
    tags: node.properties['tags'] || [],
    updatedAt: node.updateDate
  };

  var productPrice = node.properties['price'] as UmbracoCommercePrice;
  if (productPrice) {
    currency = productPrice.currency.code;
    minPrice = productPrice.withTax;
    maxPrice = productPrice.withTax;

    product.variants = [
      {
        id: node.id,
        title: node.name,
        availableForSale: (node.properties['stock'] as number) > 0,
        selectedOptions: [],
        price: reshapePrice(productPrice)
      }
    ];
  }

  let variants = node.properties['variants'] as UmbracoCommerceVariantPropertyValue;
  if (variants) {
    product.options = variants.attributes.map((attr) => ({
      id: attr.alias,
      name: attr.name,
      values: attr.values.map((val) => val.alias) // Not sure on this as we only use the alias, not a nice name?
    }));

    let productVariants = <ProductVariant[]>[];

    variants.items.forEach((itm) => {
      if (itm.content) {
        var variantPrice = itm.content.properties['price'] as UmbracoCommercePrice;
        if (!variantPrice) {
          // If there is no variant price, assume it's the base product price
          variantPrice = productPrice;
        }

        var variantAvailable = (itm.content.properties['stock'] as number) > 0;

        minPrice = minPrice == 0 ? variantPrice.withTax : Math.min(minPrice, variantPrice.withTax);
        maxPrice = maxPrice == 0 ? variantPrice.withTax : Math.max(minPrice, variantPrice.withTax);
        currency = variantPrice.currency.code;

        product.availableForSale = variantAvailable || product.availableForSale;

        productVariants.push(<ProductVariant>{
          id: node.id + ':' + itm.content.id,
          title: node.name + ' ' + itm.content.properties['sku'],
          availableForSale: variantAvailable,
          selectedOptions: Object.entries(itm.attributes).map(([k, v]) => ({
            name: k,
            value: v
          })),
          price: reshapePrice(variantPrice)
        });
      }
    });

    if (productVariants.length > 0) {
      product.variants = productVariants;
    }
  }

  let media = (node.properties['images'] || node.properties['image']) as UmbracoMedia[];
  if (media.length > 0) {
    var images = media.map((m) => reshapeImage(m));
    product.featuredImage = images[0]!;
    product.images = images;
  }

  product.priceRange = {
    minVariantPrice: { amount: minPrice.toString(), currencyCode: currency },
    maxVariantPrice: { amount: maxPrice.toString(), currencyCode: currency }
  };

  return product;
};

const reshapeProducts = (nodes: UmbracoNode[]): Product[] => {
  return <Product[]>(nodes || []).map((n) => reshapeProduct(n)).filter((n) => !!n);
};

const reshapePage = (node: UmbracoNode): Page => {
  let nodeAlias = node.route.path
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .pop();
  let nodeHandle = nodeAlias || node.id;

  let metaTitle = node.properties['metaTitle']?.toString() || node.name;
  let metaDescription = node.properties['metaDescription']?.toString();

  return {
    id: node.id,
    handle: nodeHandle,
    title: node.name,
    body: node.properties['bodyText']?.markup,
    bodySummary: node.properties['summary'],
    seo: {
      title: metaTitle,
      description: metaDescription
    },
    createdAt: node.createDate,
    updatedAt: node.updateDate
  };
};

const reshapePages = (nodes: UmbracoNode[]): Page[] => {
  return <Page[]>(nodes || []).map((n) => reshapePage(n)).filter((n) => !!n);
};

export async function createCart(): Promise<Cart> {
  const res = await umbracoCommerceFetch<UmbracoCommerceOrder>({
    method: 'POST',
    path: '/orders',
    cache: 'no-store',
    payload: {
      currency: 'USD'
    }
  });
  return reshapeOrder(res.body);
}

export async function addToCart(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  // We assume there is only one item to be added at a time
  // which looking at the code is the case. May need to keep
  // track to see if it ever gets implemented that multiple
  // items can be added at once.
  var line = lines[0];
  var idParts = line!.merchandiseId.split(':');

  const res = await umbracoCommerceFetch<UmbracoCommerceOrder>({
    method: 'POST',
    path: `/order/${cartId}`,
    cache: 'no-store',
    payload: {
      productReference: idParts[0],
      productVariantReference: idParts.length == 2 ? idParts[1] : null,
      quantity: 1
    }
  });

  return reshapeOrder(res.body);
}

export async function removeFromCart(cartId: string, lineIds: string[]): Promise<Cart> {
  // We assume there is only one item to be removed at a time
  // which looking at the code is the case. May need to keep
  // track to see if it ever gets implemented that multiple
  // items can be removed at once.
  var lineId = lineIds[0];

  const res = await umbracoCommerceFetch<UmbracoCommerceOrder>({
    method: 'DELETE',
    path: `/order/${cartId}/item/${lineId}`,
    cache: 'no-store'
  });

  return reshapeOrder(res.body);
}

export async function updateCart(
  cartId: string,
  lines: { id: string; merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const res = await umbracoCommerceFetch<UmbracoCommerceOrder>({
    method: 'PATCH',
    path: `/order/${cartId}/items`,
    cache: 'no-store',
    payload: lines.map((line) => ({
      id: line.id,
      quantity: line.quantity
    }))
  });

  return reshapeOrder(res.body);
}

export async function getCart(cartId: string): Promise<Cart | undefined> {
  const res = await umbracoCommerceFetch<UmbracoCommerceOrder>({
    method: 'GET',
    path: `/order/${cartId}`,
    cache: 'no-store'
  });

  if (!res.body || res.body.isFinalized) {
    return undefined;
  }

  return reshapeOrder(res.body);
}

export async function getMenu(handle: string): Promise<Menu[]> {
  // Handles are in the format `next-js-frontend-header-menu` so
  // we'll trim the beginning and end
  handle = handle.replace(/^next-js-frontend-|-menu$/g, '');

  // We assume there is a mntp on the pages root that defines the menu

  const res = await umbracoContentFetch<UmbracoNode>({
    method: 'GET',
    path: `/content/item/pages`,
    tags: [TAGS.collections, TAGS.products, TAGS.pages]
  });

  let menu = res.body?.properties[`${handle}Menu`] as UmbracoLink[];

  return (
    menu?.map((itm) => {
      const path = itm.linkType == 'External' ? itm.url : itm.route?.path;

      const nodeAlias = path!
        .replace(/^\/+|\/+$/g, '')
        .split('/')
        .pop();

      const isCollection = itm.linkType == 'Content' && /collection$/i.test(itm.destinationType!);

      return {
        title: itm.title,
        path: `${isCollection ? '/search/' : '/'}${nodeAlias}`
      };
    }) || []
  );
}

export async function getCollections(): Promise<Collection[]> {
  const res = await umbracoContentFetch<UmbracoPagedResult<UmbracoNode>>({
    method: 'GET',
    path: `/content`,
    query: {
      fetch: `children:collections`
    },
    tags: [TAGS.collections]
  });

  const collections = [
    {
      handle: '',
      title: 'All',
      description: 'All products',
      seo: {
        title: 'All',
        description: 'All products'
      },
      path: '/search',
      updatedAt: new Date().toISOString()
    },
    // Filter out the `hidden` collections.
    // Collections that start with `hidden-*` need to be hidden on the search page.
    ...reshapeCollections(res.body?.items).filter(
      (collection) => !collection.handle.startsWith('hidden')
    )
  ];

  return <Collection[]>collections;
}

export async function getCollection(handle: string): Promise<Collection | undefined> {
  const res = await umbracoContentFetch<UmbracoNode>({
    method: 'GET',
    path: `/content/item/${handle}`,
    headers: {
      'Start-Item': 'collections'
    },
    tags: [TAGS.collections]
  });

  return reshapeCollection(res.body);
}

export async function getCollectionProducts({
  collection,
  reverse,
  sortKey
}: {
  collection: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  // Annoyingly we have to get the collection to work out it's type
  // then based on the collection type, we can build the right product query
  const res1 = await umbracoContentFetch<UmbracoNode>({
    method: 'GET',
    path: `/content/item/${collection}`,
    headers: {
      'Start-Item': 'collections'
    },
    tags: [TAGS.collections, TAGS.products]
  });

  let prodQuery = <Record<string, string | string[]>>{
    fetch: `children:products`,
    expand: `property:variants`
  };

  if (sortKey && sortKey != 'relevance') {
    prodQuery.sort = `${sortKey}:${reverse ? 'desc' : 'asc'}`;
  }

  if (res1.body?.contentType == 'manualCollection') {
    prodQuery.filter = `id:${res1.body.properties['products']
      .map((p: { id: string }) => p.id)
      .join(',')}`;
  } else if (res1.body?.contentType == 'tagCollection') {
    prodQuery.filter = `tag:${res1.body.properties['tags'].join(',')}`;
  } else {
    console.log(`Unknown collection type: ${res1.body?.contentType}`);
    return [];
  }

  const res2 = await umbracoContentFetch<UmbracoPagedResult<UmbracoNode>>({
    method: 'GET',
    path: `/content`,
    query: prodQuery,
    tags: [TAGS.collections, TAGS.products]
  });

  if (res2.body?.items) {
    return reshapeProducts(res2.body?.items);
  }

  console.log(`No collection found for \`${collection}\``);
  return [];
}

export async function getProducts({
  query,
  reverse,
  sortKey
}: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  var queryParams = <Record<string, string | string[]>>{
    fetch: `children:products`,
    expand: 'property:variants'
  };

  if (query) {
    queryParams.filter = `name:${query}`;
  }

  if (sortKey && sortKey != 'relevance') {
    queryParams.sort = `${sortKey}:${reverse ? 'desc' : 'asc'}`;
  }

  const res = await umbracoContentFetch<UmbracoPagedResult<UmbracoNode>>({
    method: 'GET',
    path: `/content`,
    query: queryParams,
    tags: [TAGS.products]
  });

  return reshapeProducts(res.body?.items);
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  const res = await umbracoContentFetch<UmbracoNode>({
    method: 'GET',
    path: `/content/item/${handle}`,
    headers: {
      'Start-Item': 'products'
    },    
    query: {
      expand: 'property:variants'
    },
    tags: [TAGS.products]
  });

  return reshapeProduct(res.body);
}

export async function getProductRecommendations(productId: string): Promise<Product[]> {
  // Get the product
  const res = await umbracoContentFetch<UmbracoNode>({
    method: 'GET',
    path: `/content/item/${productId}`,
    headers: {
      'Start-Item': 'products'
    },
    tags: [TAGS.products]
  });

  // Get the product tags (if it has any)
  const tags = <string[]>(res.body.properties['tags'] || []);
  if (tags.length == 0) {
    return [];
  }

  // Get other products with tags
  const res2 = await umbracoContentFetch<UmbracoPagedResult<UmbracoNode>>({
    method: 'GET',
    path: `/content`,
    query: {
      fetch: `children:products`,
      filter: `tag:${tags.join(',')}`
    },
    tags: [TAGS.products]
  });

  // Return products filtering out current product
  return reshapeProducts(res2.body?.items.filter((x) => x.id != productId));
}

export async function getPage(handle: string): Promise<Page> {
  const res = await umbracoContentFetch<UmbracoNode>({
    method: 'GET',
    path: `/content/item/${handle}`,
    headers: {
      'Start-Item': 'pages'
    },
    tags: [TAGS.pages]
  });

  return reshapePage(res.body);
}

export async function getPages(): Promise<Page[]> {
  const res = await umbracoContentFetch<UmbracoPagedResult<UmbracoNode>>({
    method: 'GET',
    path: `/content`,
    query: {
      fetch: `children:pages`
    },
    tags: [TAGS.pages]
  });

  return reshapePages(
    res.body?.items.filter(
      (node) => !node.properties['umbracoNaviHide'] || node.properties['umbracoNaviHide'] === false
    )
  );
}

// This is called from `app/api/revalidate.ts` so providers can control revalidation logic.
export async function revalidate(req: NextRequest): Promise<NextResponse> {
  // We always need to respond with a 200 status code to Shopify,
  // otherwise it will continue to retry the request.
  const collectionWebhooks = ['collections/create', 'collections/delete', 'collections/update'];
  const productWebhooks = ['products/create', 'products/delete', 'products/update'];
  const topic = headers().get('x-topic') || 'unknown';
  const secret = req.nextUrl.searchParams.get('secret');
  const isCollectionUpdate = collectionWebhooks.includes(topic);
  const isProductUpdate = productWebhooks.includes(topic);

  if (!secret || secret !== process.env.REVALIDATION_SECRET) {
    console.error('Invalid revalidation secret.');
    return NextResponse.json({ status: 200 });
  }

  if (!isCollectionUpdate && !isProductUpdate) {
    // We don't need to revalidate anything for any other topics.
    return NextResponse.json({ status: 200 });
  }

  if (isCollectionUpdate) {
    revalidateTag(TAGS.collections);
  }

  if (isProductUpdate) {
    revalidateTag(TAGS.products);
  }

  return NextResponse.json({ status: 200, revalidated: true, now: Date.now() });
}
