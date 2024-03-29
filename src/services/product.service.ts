import slugify from "slugify";
import { Between, In, LessThanOrEqual, MoreThanOrEqual, Not } from "typeorm";
import { EMPTY_ITEMS } from "../constantList";
import { AppDataSource } from "../data-source";
import Product from "../entities/product.entity";
import helper from "../utils";
import { ICrudService } from "../utils/interfaces";
import {
  BestSellerProduct,
  CreateProductDTO,
  GetAll,
  ProductParams,
  QueryParams,
  UpdateProductDTO,
} from "../utils/types";
import commentProductService from "./commentProduct.service";
import orderItemService from "./orderItem.service";
import productVariantService from "./productVariant.service";
import productVariantImageService from "./productVariantImage.service";

class ProductService
  implements ICrudService<Product, ProductParams, CreateProductDTO>
{
  updateOne(
    id: number,
    dto: Partial<CreateProductDTO>
  ): Promise<Product | null> {
    return new Promise(async (resolve, reject) => {
      try {
        const existingItem = await this.getById(id);
        if (existingItem) {
          const newItem = await this.getRepository().save({
            ...existingItem,
            ...{
              name: dto.name,
              price: dto.price,
              inventory: dto.inventory,
              description: dto.description,
              detail: dto.detail,
              metaDescription: dto.metaDescription,
              metaKeywords: dto.metaKeywords,
            },
          });
          resolve(newItem);
        }
      } catch (error) {
        console.log("VariantService.updateOne error", error);
      }
      resolve(null);
    });
  }
  updateMany(
    inputs: ({ id: number } & Partial<CreateProductDTO>)[]
  ): Promise<(Product | null)[]> {
    throw new Error("Method not implemented.");
  }
  updateInventory(id: number) {
    return new Promise(async (resolve, _) => {
      try {
        const totalInventory = await productVariantService.totalInventory(id);
        await this.updateOne(id, { inventory: totalInventory });
      } catch (error) {}
    });
  }
  createOne(dto: CreateProductDTO): Promise<Product | null> {
    return new Promise(async (resolve, reject) => {
      try {
        const { productVariants, images, ...others } = dto;
        const product = await this.getRepository().save({
          ...others,
          slug: slugify(others.name, { lower: true, locale: "vi" }),
        });
        const promises = [];
        promises.push(
          productVariantService.createMany(
            productVariants.map((item) => ({
              inventory: item.inventory,
              name: item.name,
              productId: product.id,
              price: item.price,
              variantValues: item.variantValues,
            }))
          )
        );
        promises.push(
          productVariantImageService.createMany(
            images.map((item) => ({ ...item, productId: product.id }))
          )
        );
        await Promise.allSettled(promises);
        await this.updateInventory(product.id);
        resolve(product);
      } catch (error) {
        console.log("ProductService.createOne", error);
        resolve(null);
      }
    });
  }
  createMany(listDto: CreateProductDTO[]): Promise<Product[]> {
    throw new Error("Method not implemented.");
  }
  updateProduct(id: number, dto: UpdateProductDTO): Promise<Product | null> {
    return new Promise(async (resolve, _) => {
      try {
        const promises: Array<Promise<any>> = [];
        const {
          productVariants,
          newProductVariants,
          images,
          newImages,
          deleteImages,
          updateImages,
          ...others
        } = dto;

        const product = await this.getRepository().findOneBy({ id });
        if (product) {
          console.log("product", product.id);
          const { name } = others;
          const newProduct = await this.getRepository().save({
            ...product,
            ...others,
            ...(name
              ? { slug: slugify(name, { lower: true, locale: "vi" }) }
              : {}),
          });
          if (newProductVariants && newProductVariants.length > 0) {
            promises.push(
              productVariantService.createMany(
                newProductVariants.map((item) => ({
                  inventory: item.inventory,
                  name: item.name,
                  productId: newProduct.id,
                  price: item.price,
                  variantValues: item.variantValues,
                }))
              )
            );
          }
          if (newImages) {
            promises.push(
              productVariantImageService.createProductVariantImages(
                newImages.map((item) => ({
                  variantValueId:
                    item.variantValueId === 0 ? null : item.variantValueId,
                  productId: newProduct.id,
                  path: item.path,
                }))
              )
            );
          }
          if (deleteImages) {
            promises.push(productVariantImageService.deleteMany(deleteImages));
          }
          if (updateImages) {
            promises.push(
              productVariantImageService.updateProductVariantImages(
                updateImages
              )
            );
          }
          await Promise.allSettled(promises);
          await this.updateInventory(newProduct.id);
          resolve(newProduct);
        }
      } catch (error) {
        console.log("ProductService.updateOne", error);
      }
      resolve(null);
    });
  }

  deleteOne(id: number): Promise<boolean> {
    return new Promise(async (resolve, _) => {
      try {
        const product = await this.getRepository().findOneBy({ id });
        if (product) {
          await productVariantService
            .getRepository()
            .delete({ productId: product.id });
          await this.getRepository().delete({ id });
        }
        resolve(true);
      } catch (error) {
        console.log("ProductService.deleteOne error", error);
        resolve(false);
      }
    });
  }
  deleteMany(listId: number[]): Promise<boolean> {
    return new Promise(async (resolve, _) => {
      try {
        await this.getRepository().delete(listId);
        resolve(true);
      } catch (error) {
        console.log("ProductService.deleteMany error", error);
        resolve(false);
      }
    });
  }
  softDeleteOne(id: number): Promise<boolean> {
    return new Promise(async (resolve, _) => {
      try {
        await this.getRepository().softDelete(id);
        resolve(true);
      } catch (error) {
        console.log("ProductService.softDeleteOne error", error);
        resolve(false);
      }
    });
  }
  softDeleteMany(listId: number[]): Promise<boolean> {
    return new Promise(async (resolve, _) => {
      try {
        await this.getRepository().softDelete(listId);
        resolve(true);
      } catch (error) {
        console.log("ProductService.softDeleteMany error", error);
        resolve(false);
      }
    });
  }
  restoreOne(id: number): Promise<boolean> {
    return new Promise(async (resolve, _) => {
      try {
        await this.getRepository().restore(id);
        resolve(true);
      } catch (error) {
        console.log("ProductService.restoreOne error", error);
        resolve(false);
      }
    });
  }
  restoreMany(listId: number[]): Promise<boolean> {
    return new Promise(async (resolve, _) => {
      try {
        await this.getRepository().restore(listId);
        resolve(true);
      } catch (error) {
        console.log("ProductService.restoreMany error", error);
        resolve(false);
      }
    });
  }
  getRelations(params: ProductParams) {
    const { product_variants, images, group_product } = params;
    return {
      ...(product_variants
        ? { productVariants: { variantValues: { variant: true } } }
        : {}),
      ...(images ? { images: true } : {}),
      ...(group_product ? { groupProduct: true } : {}),
    };
  }
  search(params: ProductParams): Promise<GetAll<Product>> {
    return new Promise(async (resolve, _) => {
      try {
        const { q, images } = params;
        const { wherePagination } = helper.handlePagination(params);
        const { sort, sortBy, sortType } = helper.handleSort(params);

        let [items, count] = await this.getRepository().findAndCount({
          order: {
            ...(sortBy === "groupProduct"
              ? {
                  groupProduct: { name: sortType },
                }
              : sort),
            ...(images ? { images: { id: "DESC" } } : {}),
          },
          where: [helper.handleILike("slug", q), helper.handleILike("name", q)],
          withDeleted: false,
          ...wherePagination,
          relations: this.getRelations(params),
        });
        // const newProducts = products.map((product: Product) => ({
        //   ...product,
        //   minPrice: this.price(product, "min"),
        //   maxPrice: this.price(product, "max"),
        // })) as ProductHasMinMaxPrice[];

        resolve({ items, count });
      } catch (error) {
        console.log("ProductService.search error", error);
        resolve(EMPTY_ITEMS);
      }
    });
  }
  getRepository() {
    return AppDataSource.getRepository(Product);
  }

  minPrice(product: Product) {
    let min = 0;
    for (let i = 1; i < product.productVariants.length; i++) {
      if (product.productVariants[min].price > product.productVariants[i].price)
        min = i;
    }
    return product.productVariants[min].price;
  }

  maxPrice(product: Product) {
    let max = 0;
    for (let i = 1; i < product.productVariants.length; i++) {
      if (product.productVariants[max].price < product.productVariants[i].price)
        max = i;
    }
    return product.productVariants[max].price;
  }

  price(product: Product, type: "min" | "max") {
    return product.productVariants && product.productVariants.length > 0
      ? type === "min"
        ? this.minPrice(product)
        : this.maxPrice(product)
      : product.price;
  }

  getAll(params: ProductParams): Promise<GetAll<Product>> {
    return new Promise(async (resolve, _) => {
      try {
        const { q } = params;
        if (q) resolve(await this.search(params));
        else {
          const {
            name,
            slug,
            images,
            group_product_slug,
            min_price,
            max_price,
            v_ids,
          } = params;
          const { wherePagination } = helper.handlePagination(params);
          const { sortBy, sortType, sort } = helper.handleSort(params);

          let [items, count] = await this.getRepository().findAndCount({
            order: {
              ...(sortBy === "groupProduct"
                ? {
                    groupProduct: { name: sortType },
                  }
                : sort),
              ...(images ? { images: { id: "DESC" } } : {}),
            },
            where: {
              ...helper.handleILike("name", name),
              ...helper.handleILike("slug", slug),
              ...(group_product_slug
                ? {
                    groupProduct: {
                      ...helper.handleILike("slug", group_product_slug),
                    },
                  }
                : {}),
              ...(min_price && !max_price
                ? { productVariants: { price: MoreThanOrEqual(+min_price) } }
                : {}),
              ...(max_price && !min_price
                ? { productVariants: { price: LessThanOrEqual(+max_price) } }
                : {}),
              ...(max_price && max_price
                ? {
                    productVariants: {
                      price: Between(+(min_price || "0"), +(max_price || "0")),
                    },
                  }
                : {}),
              ...(v_ids
                ? {
                    productVariants: {
                      variantValues: { id: In(v_ids.split("-")) },
                    },
                  }
                : {}),
            },
            ...wherePagination,
            relations: this.getRelations(params),
          });
          resolve({ items, count });
          // if (product_variants) {
          //   const newProducts = products.map((product: Product) => ({
          //     ...product,
          //     minPrice: this.price(product, "min"),
          //     maxPrice: this.price(product, "max"),
          //   })) as ProductHasMinMaxPrice[];
          //   if (sortBy && sortBy === "price")
          //     newProducts.sort(
          //       (a: ProductHasMinMaxPrice, b: ProductHasMinMaxPrice) =>
          //         (a.minPrice - b.minPrice) * (sortType === "ASC" ? 1 : -1)
          //     );
          //   resolve({ items: newProducts, count });
          // } else {
          //   resolve({ items: products, count });
          // }
        }
      } catch (error) {
        console.log("ProductService.getAll error", error);
      }
      resolve(EMPTY_ITEMS);
    });
  }

  getById(id: number): Promise<Product | null> {
    return new Promise(async (resolve, _) => {
      try {
        const item = await this.getRepository().findOne({
          where: { id },
          relations: {
            productVariants: {
              variantValues: true,
            },
            images: true,
          },
        });
        resolve(item);
      } catch (error) {
        console.log("ProductService.getById error", error);
      }
      resolve(null);
    });
  }

  bestSellers(): Promise<BestSellerProduct[]> {
    return new Promise(async (resolve, _) => {
      try {
        const items = await orderItemService
          .getRepository()
          .createQueryBuilder("ctdh")
          .leftJoin("ctdh.productVariant", "mhbt")
          .leftJoin("mhbt.product", "mh")
          .leftJoin("ctdh.order", "dh")
          .groupBy("mh.mahang")
          .select("sum(ctdh.soluong)", "total")
          .addSelect("mh.mahang", "productId")
          .addSelect("mh.tenhang", "productName")
          .addSelect("mh.hinhanh", "thumbnail")
          .addSelect("mh.solongton", "inventory")
          .where("dh.dathanhtoan = :isPaid", { isPaid: true })
          .orderBy("sum(ctdh.soluong)", "DESC")
          .getRawMany();

        resolve(
          items.splice(0, 10).map((item) => ({ ...item, total: +item.total }))
        );
      } catch (error) {
        console.log("BEST SELLERS ERROR", error);
        resolve([]);
      }
    });
  }

  updateThumbnail(id: number, thumbnail: string): Promise<Product | null> {
    return new Promise(async (resolve, _) => {
      try {
        const product = await this.getRepository().findOneBy({ id });
        if (product) {
          const newProduct = await this.getRepository().save({
            ...product,
            thumbnail,
          });
          resolve(newProduct);
        }
      } catch (error) {
        console.log("UPDATE PRODUCT ERROR", error);
      }
      resolve(null);
    });
  }

  updateStar(id: number): Promise<boolean> {
    return new Promise(async (resolve, _) => {
      try {
        const data = await commentProductService.getAll({
          productId: `${id}`,
        });
        if (data) {
          const { items } = data;
          const star = helper.everageStar(items);
          await this.getRepository().update({ id }, { star });
          _io.emit("Update Star Product", { id, star });
          resolve(true);
        }
      } catch (error) {
        console.log("UPDATE PRODUCT STAR ERROR", error);
      }
      resolve(false);
    });
  }

  recommend(params: { slug?: string } & QueryParams): Promise<GetAll<Product>> {
    return new Promise(async (resolve, _) => {
      try {
        const { slug } = params;
        const { sort } = helper.handleSort(params);
        const { wherePagination } = helper.handlePagination(params);
        const item = await this.getRepository().findOne({
          where: { slug: `${slug}` },
          relations: { groupProduct: true },
        });
        if (item) {
          const [items, count] = await this.getRepository().findAndCount({
            order: sort,
            where: {
              id: Not(item.id),
              groupProductId: item.groupProductId,
            },
            ...wherePagination,
          });
          resolve({ items, count });
        }
      } catch (error) {
        console.log("ProductService.recommend error", error);
      }
      resolve(EMPTY_ITEMS);
    });
  }
}

const productService = new ProductService();

export default productService;
