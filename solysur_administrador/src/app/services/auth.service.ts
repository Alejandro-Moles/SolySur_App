import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from '@angular/fire/auth';
import {doc, Firestore, setDoc} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private auth: Auth, private fireStore: Firestore) {
  }

  async login({email, password}) {
    try {
      return await signInWithEmailAndPassword(this.auth, email, password);
    } catch (e) {
      return e.message;
    }
  }

  logout() {
    return signOut(this.auth);
  }

  getUserProfile() {
    const user = this.auth.currentUser;
    return user;
  }

  async insertUser(name, dni, trabajo, email, categoria, contrasenia){
    const userEmail = email;
    const userName = name;
    const userDni = dni;
    const userTrabajo = trabajo;
    try{
      const userDocRef = doc(this.fireStore, `users/${userDni}`);
      await setDoc(userDocRef, {
        userEmail,
        userName,
        userDni,
        userTrabajo,
        userCategoria: categoria,
        userContrasenia: contrasenia
      });
      return true;
    }catch (err){
      console.log(err);
      return false;
    }
  }


}
