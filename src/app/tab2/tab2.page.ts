import { Component } from '@angular/core';

import { PhotoService, UserPhoto } from '../services/photo.service';
import {ActionSheetController} from '@ionic/angular'; // Import For Deleting Images Function

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {

  constructor(
    public photoService: PhotoService,
    public actionSheetController: ActionSheetController
    ){ };

  addPhotoToGallery() {
    this.photoService.addNewToGallery();
  };

  public async ngOnInit(){
    await this.photoService.loadSaved();
  }

  public async showActionSheet(photo: UserPhoto, position: number){
    const actionSheet = await this.actionSheetController.create({
      header: "Photos",
      buttons: [{
        // Delete Button
        text: "Delete",
        role: 'destructive',
        icon: 'trash',
        handler: () => {
          this.photoService.deletePicture(photo, position);
        }
      }, {
        // Cancel Button
        text: 'Cancel',
        icon: 'close',
        role: 'cancel',
        handler: () => {
          // Nothing yet
        }
      }]
    });

    await actionSheet.present();
  }
}
