"use client";

import {
  Clock,
  MapPin,
  Phone,
} from 'lucide-react';
import { ShopFooter } from '@/components/shop/footer';
import { ShopHeader } from '@/components/shop/header';

export default function ContactsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <ShopHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Контакти</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-k24-yellow/10 rounded-lg text-k24-yellow">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-1">Адреса</h3>
                <p className="text-zinc-400">вулиця Нижньодніпровська, Дніпро, 49000</p>
                <p className="text-zinc-500 text-sm mt-1">Дніпропетровська область</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-k24-yellow/10 rounded-lg text-k24-yellow">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-1">Телефони</h3>
                <div className="space-y-1">
                  <p className="text-zinc-400"><a href="tel:+380987774401" className="hover:text-k24-yellow transition-colors">+38 (098) 777-44-01</a></p>
                  <p className="text-zinc-400"><a href="tel:+380979590505" className="hover:text-k24-yellow transition-colors">+38 (097) 959-05-05</a></p>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-k24-yellow/10 rounded-lg text-k24-yellow">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-1">Графік роботи</h3>
                <div className="space-y-1 text-zinc-400">
                  <p>Пн-Пт: 9:00 - 18:00</p>
                  <p>Сб-Нд: Вихідний</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden bg-zinc-900 h-[400px] border border-zinc-800">
            {/* Placeholder for map */}
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d5284.241771620026!2d35.03727!3d48.530915!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40d959cc38a83879%3A0xe26e803710fa4587!2sK24.kuzovnyy%20Tsentr!5e0!3m2!1sru!2sua!4v1768832820784!5m2!1sru!2sua"
              width="100%" 
              height="100%"  
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy"
              className="opacity-80 hover:opacity-100 transition-all duration-500"
            ></iframe>
          </div>
        </div>
      </main>
      <ShopFooter />
    </div>
  );
}
