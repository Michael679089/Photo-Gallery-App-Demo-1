import { Injectable } from '@angular/core';

import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';
import { Capacitor } from '@capacitor/core';

import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  // Array of Photos Storage
  public photos: UserPhoto[] = [];
  private PHOTO_STORAGE: string = 'photos';
  private platform: Platform;

  constructor(platform: Platform) {
    this.platform = platform;
  };

  private convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });
  
  private async readAsBase64(photo: Photo){
    // "Hybrid" will detect Cordova or Capacitor
    if (this.platform.is('hybrid')){
      // Read the file into base64 format
      const file = await Filesystem.readFile({
        path: photo.path
      });

      return file.data;
    } else {
      //Fetch the photo, read as a blob (data type), and then convert to base64 format
      const response = await fetch(photo.webPath!);
      const blob = await response.blob();
  
      return await this.convertBlobToBase64(blob) as string;
    }
  }

  // Saving Photo to FileSystem
  private async savePicture(photo: Photo) {
    // convert photo to base64 format
    const base64Data = await this.readAsBase64(photo);

    //Write the file to the data directory
    const fileName = new Date().getTime() + ".jpeg";
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });

    // Checking if Desktop or Mobile
    if (this.platform.is('hybrid')) { // Mobile
      // Display the new image by writing the 'file://' path to HTTPS. | Details: https://ionicframework.com/docs/building/webview#file-protocol
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      };
    } else { // Desktop
      return {
        filepath: fileName,
        webviewPath: photo.webPath
      };
    }
    

  };

  // Opening the Device CameraSource function
  public async addNewToGallery(){
    // Take a Photo
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri, 
      source: CameraSource.Camera, // The Camera
      quality: 100
    });
    
    const savedImageFile = await this.savePicture(capturedPhoto);
    this.photos.unshift(savedImageFile);

    Storage.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos)
    });
  };

  public async loadSaved(){
    // Retrieve cached photo array data.
    const photoList = await Storage.get({ key: this.PHOTO_STORAGE });
    this.photos = JSON.parse(photoList.value) || [];

    if (!this.platform.is('hybrid')){
      // Display the photo by reading into base64 format
      for (let photo of this.photos){
        //Read each saved photo's data from Filesystem
        const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data
        });
  
        // Web platform only: Load the photo as base64 data.
        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
      };
    }
  };
  
  public async deletePicture(photo: UserPhoto, position: number){
    this.photos.splice(position, 1);

    Storage.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos)
    });

    // Delete photofile from filesystem
    const filename = photo.filepath.substring(photo.filepath.lastIndexOf('/') + 1);
    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Data
    });
  }
}

export interface UserPhoto {
  filepath: string;
  webviewPath: string;
}


