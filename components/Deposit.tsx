"use client"

import { QRCodeSVG } from "qrcode.react";

export default function Deposit({ address }: { address: string }) {
    return (
        <div className="p-4 bg-gray-100 rounded-md flex flex-col items-center">
            <h2 className="text-xl font-bold mb-2">Deposit</h2>
            <QRCodeSVG value={address} size={128} />
            <p className="mt-2 font-mono text-sm"> {address}</p>
        </div>
    );
}