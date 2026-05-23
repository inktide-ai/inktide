using System.Security.Cryptography;
using System.Xml.Linq;
using Microsoft.AspNetCore.DataProtection.XmlEncryption;
using Microsoft.Extensions.DependencyInjection;

namespace Inktide.API.Soul.Infrastructure.Security;

/// <summary>
/// Encrypts the Data Protection key ring XML with AES-256-CBC using a master key
/// supplied via configuration. Ensures the key ring stored in the DB is not readable
/// without the master key — so a DB-only breach does not expose the encryption keys.
/// </summary>
public sealed class MasterKeyXmlEncryptor : IXmlEncryptor
{
    private readonly byte[] _masterKey;

    public MasterKeyXmlEncryptor(byte[] masterKey)
    {
        if (masterKey.Length < 32)
            throw new ArgumentException("Master key must be at least 32 bytes (256 bits).", nameof(masterKey));
        _masterKey = masterKey;
    }

    public EncryptedXmlInfo Encrypt(XElement plaintextElement)
    {
        var plaintext = plaintextElement.ToString(SaveOptions.DisableFormatting);
        var plaintextBytes = System.Text.Encoding.UTF8.GetBytes(plaintext);

        using var aes = Aes.Create();
        aes.KeySize = 256;
        aes.Key = _masterKey[..32];
        aes.GenerateIV();

        using var ms = new MemoryStream();
        ms.Write(aes.IV, 0, aes.IV.Length);

        using (var cs = new CryptoStream(ms, aes.CreateEncryptor(), CryptoStreamMode.Write))
        {
            cs.Write(plaintextBytes);
        }

        var ciphertext = Convert.ToBase64String(ms.ToArray());
        var encryptedElement = new XElement("encryptedKey", new XAttribute("enc", "aes256cbc"), ciphertext);
        return new EncryptedXmlInfo(encryptedElement, typeof(MasterKeyXmlDecryptor));
    }
}

/// <summary>Counterpart to <see cref="MasterKeyXmlEncryptor"/> — registered in DI for runtime key decryption.</summary>
public sealed class MasterKeyXmlDecryptor : IXmlDecryptor
{
    private readonly byte[] _masterKey;

    public MasterKeyXmlDecryptor(IServiceProvider services)
    {
        _masterKey = services.GetRequiredService<MasterKeyHolder>().Key;
    }

    public XElement Decrypt(XElement encryptedElement)
    {
        var ciphertext = Convert.FromBase64String(encryptedElement.Value.Trim());

        using var aes = Aes.Create();
        aes.KeySize = 256;
        aes.Key = _masterKey[..32];

        int ivLen = aes.BlockSize / 8;
        aes.IV = ciphertext[..ivLen];
        var data = ciphertext[ivLen..];

        using var ms = new MemoryStream(data);
        using var cs = new CryptoStream(ms, aes.CreateDecryptor(), CryptoStreamMode.Read);
        using var reader = new StreamReader(cs, System.Text.Encoding.UTF8);
        var plaintext = reader.ReadToEnd();
        return XElement.Parse(plaintext);
    }
}

/// <summary>Carries the master key bytes through DI so <see cref="MasterKeyXmlDecryptor"/> can resolve it.</summary>
public sealed class MasterKeyHolder
{
    public byte[] Key { get; }
    public MasterKeyHolder(byte[] key) => Key = key;
}
