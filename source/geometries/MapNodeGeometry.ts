import {BufferGeometry, Float32BufferAttribute} from 'three';

/**
 * Map node geometry is a geometry used to represent the map nodes.
 *
 * Consists of a XZ plane with normals facing +Y.
 * 
 * The geometry points start in XZ plane that can be manipulated for example for height adjustment.
 * 
 * Geometry can also include skirts to mask off missalignments between tiles.
 */
export class MapNodeGeometry extends BufferGeometry
{
	/**
	 * Map node geometry constructor.
	 *
	 * @param width - Width of the node.
	 * @param height - Height of the node.
	 * @param widthSegments - Number of subdivisions along the width.
	 * @param heightSegments - Number of subdivisions along the height.
	 * @param skirt - Skirt around the plane to mask gaps between tiles. 非高程几何体，不带skirt
	 */
	public constructor(width: number = 1.0, height: number = 1.0, widthSegments: number = 1.0, heightSegments: number = 1.0, skirt: boolean = false, skirtDepth: number = 10.0)
	{
		super();

		// Buffers
		const indices = []; // [0,2,1,2,3,1] 四边形分两个三角形进行绘制，顶点索引数组
		const vertices = []; // 顶点数组，每个顶点的三维坐标
		const normals = []; // 顶点法线数组，每个顶点的法线向量
		const uvs = []; // 顶点纹理坐标数组，每个顶点的纹理坐标  [0,1,1,1,0,0,1,0]


		// Build plane
		MapNodeGeometry.buildPlane(width, height, widthSegments, heightSegments, indices, vertices, normals, uvs);

		// Generate the skirt
		if (skirt)
		{
			MapNodeGeometry.buildSkirt(width, height, widthSegments, heightSegments, skirtDepth, indices, vertices, normals, uvs);
		}

		this.setIndex(indices);
		this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
		this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
		this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
	}

	public static buildPlane(width: number = 1.0, height: number = 1.0, widthSegments: number = 1.0, heightSegments: number = 1.0, indices: number[], vertices: number[], normals: number[], uvs: number[]): void
	{
		// Half width X 
		const widthHalf = width / 2;

		// Half width Z
		const heightHalf = height / 2;

		// Size of the grid in X
		const gridX = widthSegments + 1;

		// Size of the grid in Z
		const gridZ = heightSegments + 1;

		// Width of each segment X
		const segmentWidth = width / widthSegments;
		
		// Height of each segment Z
		const segmentHeight = height / heightSegments;

		// Generate vertices, normals and uvs
		for (let iz = 0; iz < gridZ; iz++) 
		{
			const z = iz * segmentHeight - heightHalf;

			for (let ix = 0; ix < gridX; ix++) 
			{
				const x = ix * segmentWidth - widthHalf;

				vertices.push(x, 0, z);
				normals.push(0, 1, 0);
				uvs.push(ix / widthSegments, 1 - iz / heightSegments);
			}
		}

		// Indices
		for (let iz = 0; iz < heightSegments; iz++) 
		{
			for (let ix = 0; ix < widthSegments; ix++) 
			{
				const a = ix + gridX * iz;
				const b = ix + gridX * (iz + 1);
				const c = ix + 1 + gridX * (iz + 1);
				const d = ix + 1 + gridX * iz;

				// Faces
				indices.push(a, b, d, b, c, d);
			}
		}
	}
	// skirts to mask off missalignments between tiles.
	// 构建裙边以掩盖错位。 和let geom = new THREE.PlaneBufferGeometry(1, 1, 256, 256); 此处很像，当构建裙边以后就是256个段，否则就是255个段
	// 该方法分别是向下构建一个裙边，不是上面一行代码，是横向平面构建裙边。
	public static buildSkirt(width: number = 1.0, height: number = 1.0, widthSegments: number = 1.0, heightSegments: number = 1.0, skirtDepth: number, indices: number[], vertices: number[], normals: number[], uvs: number[]): void
	{
		// Half width X，  0.5
		const widthHalf = width / 2;

		// Half width Z， 0.5
		const heightHalf = height / 2;

		// Size of the grid in X， 17
		const gridX = widthSegments + 1;

		// Size of the grid in Z, 17
		const gridZ = heightSegments + 1;

		// Width of each segment X， 1/16 = 0.0625
		const segmentWidth = width / widthSegments;
		
		// Height of each segment Z, 1/16 = 0.0625
		const segmentHeight = height / heightSegments;

		let start = vertices.length / 3; // 17 * 17 * 3 / 3 = 289 共289个坐标点

		// Down X 负向x轴
		for (let ix = 0; ix < gridX; ix++) 
		{
			const x = ix * segmentWidth - widthHalf;
			const z = -heightHalf;
			//vertices add values(x,z): [-0.5, -0.5], [-0.4375, -0.5], [-0.375, -0.5], [-0.3125, -0.5],[-0.25, -0.5]
			vertices.push(x, -skirtDepth, z);
			normals.push(0, 1, 0);
			uvs.push(ix / widthSegments, 1);
			// uvs: [0, 1], [0.0625, 1], [0.125, 1], [0.1875, 1], [0.25, 1]
		}

		// Indices
		for (let ix = 0; ix < widthSegments; ix++) 
		{
			const a = ix;
			const d = ix + 1;
			const b = ix + start;
			const c = ix + start + 1;
			indices.push(d, b, a, d, c, b);
			// indices: [1, 289, 0, 1, 290, 289], [2, 290, 1, 2, 291, 290], [3, 291, 2, 3, 292, 291], [4, 292, 3, 4, 293, 292], [5, 293, 4, 5, 294, 293]
		}
		// 经过操作， start已经增加了gridx（17）个点 为306
		start = vertices.length / 3;

		// Up X 正向x轴
		for (let ix = 0; ix < gridX; ix++) 
		{
			const x = ix * segmentWidth - widthHalf; //
			const z = heightSegments * segmentHeight - heightHalf; // 0.5
			//vertices add values(x,z): [-0.5, 0.5], [-0.4375, 0.5], [-0.375, 0.5], [-0.3125, 0.5],[-0.25, 0.5]
			vertices.push(x, -skirtDepth, z);
			normals.push(0, 1, 0);
			uvs.push(ix / widthSegments, 0);
			// uvs: [0, 0], [0.0625, 0], [0.125, 0], [0.1875, 0], [0.25, 0]
		}
		
		// Index of the beginning of the last X row
		let offset = gridX * gridZ - widthSegments - 1; // 17*17-16-1=272

		for (let ix = 0; ix < widthSegments; ix++) 
		{
			const a = offset + ix;
			const d = offset + ix + 1;
			const b = ix + start;
			const c = ix + start + 1;
			indices.push(a, b, d, b, c, d);
			// indices: [272, 306, 273, 306, 307, 273], [273, 307, 274, 307, 308, 274], [274, 308, 275, 308, 309, 275]
		}
		// 经过上轮添加，再次增加了gridx（17）个点， 为306+17=323
		start = vertices.length / 3;

		// Down Z 负向z轴
		for (let iz = 0; iz < gridZ; iz++) 
		{
			const z = iz * segmentHeight - heightHalf;
			const x = - widthHalf;
			//vertices add values(x,z): [-0.5, -0.5], [-0.5，-0.4375], [-0.5，-0.375], [-0.5，-0.3125],[-0.5，-0.25]
			vertices.push(x, -skirtDepth, z);
			normals.push(0, 1, 0);
			uvs.push(0, 1 - iz / heightSegments);
			//uvs: [0, 1], [0, 0.9375], [0, 0.875], [0, 0.8125], [0, 0.75]
		}

		for (let iz = 0; iz < heightSegments; iz++) 
		{
			const a = iz * gridZ;
			const d = (iz + 1) * gridZ;
			const b = iz + start;
			const c = iz + start + 1;

			indices.push(a, b, d, b, c, d);
			// indices: [0, 323, 17, 323, 324, 17], [17, 324, 34, 324, 325, 34], [34, 325, 51, 325, 326, 51]
		}
		// 经过上轮添加，再次增加了gridx（17*2）个点， 为323+17=340
		start = vertices.length / 3;

		// Up Z 正向z轴
		for (let iz = 0; iz < gridZ; iz++) 
		{
			const z = iz * segmentHeight - heightHalf;
			const x = widthSegments * segmentWidth - widthHalf;
			//vertices add values(x,z): [0.5, -0.5], [0.5，-0.4375], [0.5，-0.375], [0.5，-0.3125],[0.5，-0.25]
			vertices.push(x, -skirtDepth, z);
			normals.push(0, 1, 0);

			uvs.push(1.0, 1 - iz / heightSegments);
			//uvs: [1, 1], [1, 0.9375], [1, 0.875], [1, 0.8125], [1, 0.75]
		}

		for (let iz = 0; iz < heightSegments; iz++) 
		{
			const a = iz * gridZ + heightSegments;
			const d = (iz + 1) * gridZ + heightSegments;
			const b = iz + start;
			const c = iz + start + 1;
			
			indices.push(d, b, a, d, c, b);
			// indices: [33, 340, 16, 33, 341, 340], [50, 341, 33, 50, 342, 341], [67, 342, 50, 67, 343, 342]
		}
	}
}
