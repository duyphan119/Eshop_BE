import { EMPTY_ITEMS } from "../constantList";
import { AppDataSource } from "../data-source";
import ProductVariantImage from "../entities/productVarianImage.entity";
import helper from "../utils";
import { ICrudService } from "../utils/interfaces";
import {
  CreateProductVariantImageDTO,
  GetAll,
  ProductVariantImageParams,
} from "../utils/types";

class ProductVariantImageService
  implements
    ICrudService<
      ProductVariantImage,
      ProductVariantImageParams,
      CreateProductVariantImageDTO
    >
{
  search(
    params: ProductVariantImageParams
  ): Promise<GetAll<ProductVariantImage>> {
    throw new Error("Method not implemented.");
  }

  getAll(
    params: ProductVariantImageParams
  ): Promise<GetAll<ProductVariantImage>> {
    return new Promise(async (resolve, _) => {
      try {
        const { wherePagination } = helper.handlePagination(params);
        const { sort } = helper.handleSort(params);
        const { productId } = params;
        const [items, count] = await this.getRepository().findAndCount({
          order: sort,
          where: {
            ...helper.handleEqual("productId", productId, true),
          },
          ...wherePagination,
        });
        resolve({ items, count });
      } catch (error) {
        console.log("ProductVariantImageService.getAll error", error);
      }
      resolve(EMPTY_ITEMS);
    });
  }
  getById(id: number): Promise<ProductVariantImage | null> {
    return new Promise(async (resolve, _) => {
      try {
        const variant = await this.getRepository().findOneBy({ id });
        resolve(variant);
      } catch (error) {
        console.log("ProductVariantImageService.getById error", error);
        resolve(null);
      }
    });
  }
  createOne(
    dto: CreateProductVariantImageDTO
  ): Promise<ProductVariantImage | null> {
    return new Promise(async (resolve, reject) => {
      try {
        const newItem = await this.getRepository().save({
          productId: dto.productId,
          path: dto.path,
          ...(dto.variantValueId ? { variantValueId: dto.variantValueId } : {}),
        });
        resolve(newItem);
      } catch (error) {
        console.log("ProductVariantImageService.createOne", error);
        resolve(null);
      }
    });
  }
  createMany(
    listDto: CreateProductVariantImageDTO[]
  ): Promise<(ProductVariantImage | null)[]> {
    return new Promise(async (resolve, _) => {
      try {
        const newItems = await Promise.all(
          listDto.map((dto) => this.createOne(dto))
        );
        resolve(newItems);
      } catch (error) {
        console.log("ProductVariantImageService.createMany error", error);
        resolve([]);
      }
    });
  }
  updateOne(
    id: number,
    dto: Partial<CreateProductVariantImageDTO>
  ): Promise<ProductVariantImage | null> {
    return new Promise(async (resolve, reject) => {
      try {
        const existingItem = await this.getById(id);
        const { variantValueId, ...others } = dto;
        if (existingItem) {
          const newItem = await this.getRepository().save({
            ...existingItem,
            ...others,
            ...(variantValueId ? { variantValueId } : {}),
          });
          resolve(newItem);
        }
      } catch (error) {
        console.log("ProductVariantImageService.updateOne error", error);
      }
      resolve(null);
    });
  }
  updateMany(
    inputs: ({ id: number } & Partial<CreateProductVariantImageDTO>)[]
  ): Promise<(ProductVariantImage | null)[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const newItems = await Promise.all(
          inputs.map((input) => {
            const { id, ...dto } = input;
            return this.updateOne(id, dto);
          })
        );
        resolve(newItems);
      } catch (error) {
        console.log("ProductVariantImageService.updateMany error", error);
      }
      resolve([]);
    });
  }
  deleteOne(id: number): Promise<boolean> {
    return new Promise(async (resolve, _) => {
      try {
        const existingItem = await this.getById(id);
        if (existingItem) {
          await this.getRepository().delete(id);
          await helper.deleteImageOnCloudinary(existingItem.path);
          resolve(true);
        }
      } catch (error) {
        console.log("ProductVariantImageService.deleteOne error", error);
      }
      resolve(false);
    });
  }
  deleteMany(listId: number[]): Promise<boolean> {
    return new Promise(async (resolve, _) => {
      try {
        await Promise.all(listId.map((id) => this.deleteOne(id)));
        resolve(true);
      } catch (error) {
        console.log("ProductVariantImageService.deleteMany error", error);
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
        console.log("ProductVariantImageService.softDeleteOne error", error);
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
        console.log("ProductVariantImageService.softDeleteMany error", error);
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
        console.log("ProductVariantImageService.restoreOne error", error);
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
        console.log("ProductVariantImageService.restoreMany error", error);
        resolve(false);
      }
    });
  }
  getRepository() {
    return AppDataSource.getRepository(ProductVariantImage);
  }

  // getAll(
  //   query: ProductVariantImageParams
  // ): Promise<GetAll<ProductVariantImage>> {
  //   return new Promise(async (resolve, _) => {
  //     try {
  //       const { productId } = query;

  //       const { sort } = handleSort(query);
  //       const { wherePagination } = handlePagination(query);

  //       const [productVariantImages, count] =
  //         await this.getRepository().findAndCount({
  //           where: {
  //             ...(productId ? { productId: +productId } : {}),
  //           },
  //           ...wherePagination,
  //           order: sort,
  //         });
  //       resolve({ items: productVariantImages, count });
  //     } catch (error) {
  //       console.log("GET ALL PRODUCT VARIANT IMAGES ERROR", error);
  //       resolve(EMPTY_ITEMS);
  //     }
  //   });
  // }

  createProductVariantImages(
    dto: CreateProductVariantImageDTO[]
  ): Promise<ProductVariantImage[]> {
    return new Promise(async (resolve, _) => {
      try {
        const result = await this.getRepository().save(
          dto.map((i: CreateProductVariantImageDTO) =>
            Object.assign(new ProductVariantImage(), i)
          )
        );
        resolve(result);
      } catch (error) {
        console.log("CREATE PRODUCT VARIANT IMAGES ERROR", error);
        resolve([]);
      }
    });
  }

  // updateProductVariantImage(
  //   id: number,
  //   variantValueId: number
  // ): Promise<ProductVariantImage | null> {
  //   return new Promise(async (resolve, _) => {
  //     try {
  //       const item = await this.getRepository().findOneBy({ id });
  //       if (item) {
  //         const result = await this.getRepository().save({
  //           ...item,
  //           variantValueId,
  //         });
  //         resolve(result);
  //       }
  //     } catch (error) {
  //       console.log("UPDATE PRODUCT VARIANT IMAGE ERROR", error);
  //       resolve(null);
  //     }
  //   });
  // }

  updateProductVariantImages(
    images: Array<{
      id: number;
      variantValueId: number;
    }>
  ): Promise<boolean> {
    return new Promise(async (resolve, _) => {
      try {
        const promises: Array<Promise<any>> = [];
        images.forEach((image) => {
          promises.push(
            this.getRepository().update(
              { id: image.id },
              { variantValueId: image.variantValueId }
            )
          );
        });
        await Promise.allSettled(promises);
        resolve(true);
      } catch (error) {
        console.log("UPDATE PRODUCT VARIANT IMAGE ERROR", error);
      }
      resolve(false);
    });
  }

  // deleteProductVariantImage(id: number): Promise<boolean> {
  //   return new Promise(async (resolve, _) => {
  //     try {
  //       const item = await this.getRepository().findOneBy({ id });
  //       if (item) {
  //         await getCloudinary().v2.uploader.destroy(
  //           "DoAnTotNghiep_BE" +
  //             item.path.split("DoAnTotNghiep_BE")[1].split(".")[0]
  //         );
  //         await this.getRepository().delete({ id: item.id });
  //       }
  //       resolve(true);
  //     } catch (error) {
  //       console.log("DELETE PRODUCT VARIANT IMAGES ERROR", error);
  //       resolve(false);
  //     }
  //   });
  // }
  // deleteProductVariantImages(ids: number[]): Promise<boolean> {
  //   return new Promise(async (resolve, _) => {
  //     try {
  //       const promises: Array<Promise<any>> = [];

  //       const items = await this.getRepository().find({
  //         where: { id: In(ids) },
  //       });
  //       items.forEach((item) => {
  //         promises.push(
  //           getCloudinary().v2.uploader.destroy(
  //             "DoAnTotNghiep_BE" +
  //               item.path.split("DoAnTotNghiep_BE")[1].split(".")[0]
  //           )
  //         );
  //         promises.push(this.getRepository().delete({ id: item.id }));
  //       });
  //       await Promise.allSettled(promises);
  //       resolve(true);
  //     } catch (error) {
  //       console.log("DELETE PRODUCT VARIANT IMAGES ERROR", error);
  //       resolve(false);
  //     }
  //   });
  // }
}

const productVariantImageService = new ProductVariantImageService();

export default productVariantImageService;
