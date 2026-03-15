import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryService {
  private readonly defaultFolder: string;
  private readonly logger = new Logger('CloudinaryService');

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.error('Credenciales de Cloudinary no configuradas correctamente');
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    this.defaultFolder = this.configService.get<string>('CLOUDINARY_FOLDER_NAME', 'imghotel');
  }

  async uploadImage(file: Express.Multer.File, folder?: string): Promise<string> {
    const uploadFolder = folder || this.defaultFolder;
    
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo');
    }

    if (!file.buffer) {
      throw new BadRequestException('El archivo no contiene datos (buffer vacío)');
    }

    this.logger.debug(`Uploading file: ${file.originalname}, size: ${file.size}, mime: ${file.mimetype}`);

    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: uploadFolder,
          resource_type: 'auto',
          timeout: 60000,
        },
        (error, result) => {
          if (error) {
            this.logger.error(`Cloudinary error: ${error.message}`, error);
            reject(new InternalServerErrorException(`Error al subir archivo a Cloudinary: ${error.message}`));
          } else if (result) {
            this.logger.debug(`Successfully uploaded: ${result.secure_url}`);
            resolve(result.secure_url);
          } else {
            reject(new InternalServerErrorException('Error desconocido al subir archivo'));
          }
        },
      );

      upload.on('error', (error) => {
        this.logger.error(`Stream error: ${error.message}`, error);
        reject(new InternalServerErrorException(`Error en stream de Cloudinary: ${error.message}`));
      });

      upload.end(file.buffer);
    });
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder?: string,
  ): Promise<string[]> {
    if (!files || files.length === 0) {
      return [];
    }

    const uploadPromises = files.map((file) => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }
}
