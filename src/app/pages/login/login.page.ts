import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSpinner,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { mail } from 'ionicons/icons';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonSpinner
  ],
})
export class LoginPage implements OnInit {
  email = '';
  password = '';
  isSignUp = false;
  isLoading = false;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({ mail });
  }

  async ngOnInit() {
    // Check if user is already logged in
    const session = await this.supabaseService.getSession();
    if (session) {
      this.router.navigate(['/tabs/home']);
    }
  }

  async signInWithEmail() {
    if (!this.email || !this.password) {
      await this.showToast('Please enter email and password', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Signing in...'
    });
    await loading.present();

    try {
      const { data, error } = await this.supabaseService.signIn(this.email, this.password);
      
      if (error) throw error;
      
      await this.showToast('Signed in successfully', 'success');
      this.router.navigate(['/tabs/home']);
    } catch (error: any) {
      await this.showToast(error.message || 'Error signing in', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async signUpWithEmail() {
    if (!this.email || !this.password) {
      await this.showToast('Please enter email and password', 'warning');
      return;
    }

    if (this.password.length < 6) {
      await this.showToast('Password must be at least 6 characters', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Creating account...'
    });
    await loading.present();

    try {
      const { data, error } = await this.supabaseService.signUp(this.email, this.password);
      
      if (error) throw error;
      
      await this.showToast('Account created! Please check your email to verify your account.', 'success');
      this.isSignUp = false;
    } catch (error: any) {
      await this.showToast(error.message || 'Error creating account', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async signInWithOAuth(provider: 'spotify' | 'figma') {
    const loading = await this.loadingController.create({
      message: `Signing in with ${provider}...`
    });
    await loading.present();

    try {
      const { data, error } = await this.supabaseService.signInWithOAuth(provider);
      
      if (error) throw error;
      
      // OAuth redirect will happen automatically
      // The app will handle the callback
    } catch (error: any) {
      await loading.dismiss();
      await this.showToast(error.message || `Error signing in with ${provider}`, 'danger');
    }
  }

  toggleSignUp() {
    this.isSignUp = !this.isSignUp;
    this.password = '';
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}

